import React, { useState, useEffect, useRef } from 'react';
import renderDeckInfo from '../utils/renderDeckInfo';
import CardChatInterface from './CardChatInterface';
import Tooltip from './Tooltip';
import { Card, CardWithDecks } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import { reviewCard } from '../utils/utils';
import { useProfileContext } from '../contexts/ProfileContext';
import { useUpdateCard } from '../hooks/mutations/useUpdateCard';
import MarkdownTextarea from './MarkdownTextArea';

interface FlashcardProps {
  card: CardWithDecks;
  onReview: (grade: number) => void;
}

const getNextReviewTime = (card: Card, grade: number): string => {
  const updatedCard = reviewCard({ ...card }, grade);
  const nextReview = new Date(updatedCard.next_review);
  const now = new Date();
  const diffMinutes = Math.round((nextReview.getTime() - now.getTime()) / (60 * 1000));

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  } else if (diffMinutes < 60 * 24) {
    return `${Math.round(diffMinutes / 60)}h`;
  } else {
    return `${Math.round(diffMinutes / (60 * 24))}d`;
  }
};

const Flashcard: React.FC<FlashcardProps> = ({ card, onReview }) => {
  const { profile } = useProfileContext();
  const isBasicMode = profile?.review_algorithm === 'basic';

  const [isRevealed, setIsRevealed] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [focusedGrade, setFocusedGrade] = useState<number | null>(null);
  const [lastFocusedGrade, setLastFocusedGrade] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedFront, setEditedFront] = useState(card.front);
  const [editedBack, setEditedBack] = useState(card.back);

  const updateCardMutation = useUpdateCard();

  const gradeButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const frontTextareaRef = useRef<HTMLTextAreaElement>(null);

  const handleGradeClick = (grade: number) => {
    setFocusedGrade(grade);
    onReview(grade);
  };

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updateCardMutation.mutate(
      {
        id: card.id,
        front: editedFront,
        back: editedBack,
        deckId: card.decks[0].id,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedFront(card.front);
    setEditedBack(card.back);
  };

  useEffect(() => {
    const handleRevealedModeKeys = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case 'e':
          event.preventDefault();
          handleStartEdit();
          break;
        case ' ':
        case 'enter':
          event.preventDefault();
          if (focusedGrade !== null) {
            onReview(focusedGrade);
          }
          break;
        default:
          handleGradeKeys(event);
      }
    };

    const handleUnrevealedModeKeys = (event: KeyboardEvent) => {
      if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        setIsRevealed(true);
      }
    };

    const handleGlobalKeys = (event: KeyboardEvent) => {
      if (event.code === 'KeyD') {
        event.preventDefault();
        setLastFocusedGrade(focusedGrade);
        setShowChat(true);
      }
    };

    const handleGradeKeys = (event: KeyboardEvent) => {
      if (isBasicMode) {
        handleBasicModeGradeKeys(event);
      } else {
        handleAdvancedModeGradeKeys(event);
      }
    };

    const handleBasicModeGradeKeys = (event: KeyboardEvent) => {
      if (event.key === '2' || event.key === '3') {
        const grade = parseInt(event.key);
        setFocusedGrade(grade);
        onReview(grade);
      } else if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
        event.preventDefault();
        setFocusedGrade((prev) => (prev === 2 ? 3 : 2));
      }
    };

    const handleAdvancedModeGradeKeys = (event: KeyboardEvent) => {
      if (event.key >= '1' && event.key <= '4') {
        const grade = parseInt(event.key);
        setFocusedGrade(grade);
        onReview(grade);
      } else if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {
        event.preventDefault();
        setFocusedGrade((prev) => {
          if (prev === null) return 3;
          return event.code === 'ArrowLeft' ? Math.max(1, prev - 1) : Math.min(4, prev + 1);
        });
      }
    };

    const handleKeyNavigation = (event: KeyboardEvent) => {
      // Handle Cmd+Enter (or Ctrl+Enter) for saving edits
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if (isEditing) {
          handleSaveEdit();
          return;
        }
      }

      // Handle Escape key for cancelling edits
      if (event.key === 'Escape' && isEditing) {
        event.preventDefault();
        handleCancelEdit();
        return;
      }

      // If we're in a textarea, don't handle other keys
      if (event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // ... rest of the key handling logic (for non-textarea elements)
      if (isEditing) {
        return;
      }

      if (isRevealed) {
        handleRevealedModeKeys(event);
      } else {
        handleUnrevealedModeKeys(event);
      }

      handleGlobalKeys(event);
    };

    window.addEventListener('keydown', handleKeyNavigation);
    return () => window.removeEventListener('keydown', handleKeyNavigation);
  }, [isRevealed, focusedGrade, onReview, isEditing, isBasicMode, handleStartEdit, handleCancelEdit]);

  useEffect(() => {
    if (isRevealed && !showChat) {
      setFocusedGrade((prev) => prev || 3); // Default to 'Good' if not set
      // Focus the correct button when returning from chat
      if (lastFocusedGrade !== null) {
        setFocusedGrade(lastFocusedGrade);
        setLastFocusedGrade(null);
      }
    } else if (!isRevealed) {
      setFocusedGrade(null);
    }
  }, [isRevealed, showChat, lastFocusedGrade]);

  useEffect(() => {
    if (isEditing && frontTextareaRef.current) {
      frontTextareaRef.current.focus();
    }
  }, [isEditing]);

  const renderGradeButtons = () => {
    if (isBasicMode) {
      return (
        <>
          <button
            ref={(el) => (gradeButtonsRef.current[1] = el)}
            onClick={() => handleGradeClick(2)}
            className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm border rounded transition-colors flex flex-col items-center justify-center
              ${focusedGrade === 2 ? 'bg-gray-200 border-gray-400' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
            aria-pressed={focusedGrade === 2}
          >
            <span>Forgot</span>
            <span className="text-[10px] sm:text-xs text-gray-500">{getNextReviewTime(card, 2)}</span>
          </button>
          <button
            ref={(el) => (gradeButtonsRef.current[2] = el)}
            onClick={() => handleGradeClick(3)}
            className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm border rounded transition-colors flex flex-col items-center justify-center
              ${focusedGrade === 3 ? 'bg-gray-200 border-gray-400' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
            aria-pressed={focusedGrade === 3}
          >
            <span>Remembered</span>
            <span className="text-[10px] sm:text-xs text-gray-500">{getNextReviewTime(card, 3)}</span>
          </button>
        </>
      );
    } else {
      return ['Again', 'Hard', 'Good', 'Easy'].map((label, index) => {
        const grade = index + 1;
        return (
          <button
            key={label}
            ref={(el) => (gradeButtonsRef.current[index] = el)}
            onClick={() => handleGradeClick(grade)}
            className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm border rounded transition-colors flex flex-col items-center justify-center
              ${focusedGrade === grade ? 'bg-gray-200 border-gray-400' : 'bg-white border-gray-300 hover:bg-gray-100'}`}
            aria-pressed={focusedGrade === grade}
          >
            <span>{label}</span>
            <span className="text-[10px] sm:text-xs text-gray-500">{getNextReviewTime(card, grade)}</span>
          </button>
        );
      });
    }
  };

  const renderFlashcard = () => (
    <div className="w-full max-w-2xl flex flex-col items-center justify-center px-2 sm:px-0">
      <div className="w-full mb-2 sm:mb-4 text-xs sm:text-sm text-gray-600 text-center">
        {renderDeckInfo(card.decks)}
      </div>
      <div className="w-full bg-white p-4 sm:p-6">
        <div className={`text-lg sm:text-xl ${!isRevealed && 'text-center'} mb-4 sm:mb-6`}>
          {isEditing ? (
            <MarkdownTextarea
              value={editedFront}
              onChange={setEditedFront}
              placeholder="Front (supports markdown)"
              className="w-full min-w-[250px] sm:min-w-[500px] min-h-[100px]"
              ref={frontTextareaRef}
            />
          ) : (
            <MarkdownRenderer content={card.front} />
          )}
        </div>
        {(isRevealed || isEditing) && (
          <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
            <div className="text-base sm:text-lg">
              {isEditing ? (
                <MarkdownTextarea
                  value={editedBack}
                  onChange={setEditedBack}
                  placeholder="Back (supports markdown)"
                  className="w-full min-w-[250px] sm:min-w-[500px] min-h-[100px]"
                />
              ) : (
                <MarkdownRenderer content={card.back} />
              )}
            </div>
          </div>
        )}
        {!isRevealed ? (
          <div className="flex justify-center mt-4 sm:mt-6 space-x-2 sm:space-x-4">
            <Tooltip text="Press Space/Enter">
              <button
                onClick={() => setIsRevealed(true)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Show Answer
              </button>
            </Tooltip>
            <Tooltip text="Press 'D'">
              <button
                onClick={() => {
                  setLastFocusedGrade(focusedGrade);
                  setShowChat(true);
                }}
                className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Deep Dive
              </button>
            </Tooltip>
          </div>
        ) : isEditing ? (
          <div className="flex justify-center mt-4 sm:mt-6 space-x-2 sm:space-x-4">
            <button
              onClick={handleSaveEdit}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4 sm:mt-8">{renderGradeButtons()}</div>
            <div className="text-center text-xs sm:text-sm text-gray-500">
              {isBasicMode
                ? 'Use left/right arrow keys to navigate, Space/Enter to select'
                : 'Use arrow keys to navigate, Space/Enter to select'}
            </div>
            <div className="flex justify-center space-x-2 sm:space-x-4">
              <Tooltip text="Press 'D'">
                <button
                  onClick={() => {
                    setLastFocusedGrade(focusedGrade);
                    setShowChat(true);
                  }}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Deep Dive
                </button>
              </Tooltip>
              <Tooltip text="Press 'E'">
                <button
                  onClick={handleStartEdit}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Edit
                </button>
              </Tooltip>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {showChat ? (
        <CardChatInterface card={card} isRevealed={isRevealed} onClose={() => setShowChat(false)} />
      ) : (
        <div className="flex-grow flex items-center justify-center px-2 sm:px-6">{renderFlashcard()}</div>
      )}
    </div>
  );
};

export default Flashcard;
