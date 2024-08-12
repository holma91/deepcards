import React, { useState, useEffect, useRef } from 'react';
import renderDeckInfo from '../utils/renderDeckInfo';
import CardChatInterface from './CardChatInterface';
import Tooltip from './Tooltip';
import { CardWithDecks } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface FlashcardProps {
  card: CardWithDecks;
  onReview: (grade: number) => void;
}

const getNextReviewTime = (grade: number) => {
  switch (grade) {
    case 1:
      return '<10m';
    case 2:
      return '1h';
    case 3:
      return '1d';
    case 4:
      return '4d';
    default:
      return '';
  }
};

const Flashcard: React.FC<FlashcardProps> = ({ card, onReview }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [focusedGrade, setFocusedGrade] = useState<number | null>(null);
  const [lastFocusedGrade, setLastFocusedGrade] = useState<number | null>(null);
  const gradeButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyNavigation = (event: KeyboardEvent) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }

    if (isRevealed) {
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
      } else if (event.code === 'Space' || event.code === 'Enter') {
        event.preventDefault();
        if (focusedGrade !== null) {
          onReview(focusedGrade);
        }
      }
    } else if (event.code === 'Space' || event.code === 'Enter') {
      event.preventDefault();
      setIsRevealed(true);
    }

    if (event.code === 'KeyD') {
      event.preventDefault();
      setLastFocusedGrade(focusedGrade);
      setShowChat(true);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyNavigation);
    return () => window.removeEventListener('keydown', handleKeyNavigation);
  }, [isRevealed, focusedGrade, onReview]);

  useEffect(() => {
    if (isRevealed && !showChat) {
      setFocusedGrade((prev) => prev || 3); // Default to 'Good' if not set
      // Focus the correct button when returning from chat
      if (lastFocusedGrade !== null) {
        const buttonToFocus = gradeButtonsRef.current[lastFocusedGrade - 1];
        buttonToFocus?.focus();
        setFocusedGrade(lastFocusedGrade);
        setLastFocusedGrade(null);
      }
    } else if (!isRevealed) {
      setFocusedGrade(null);
    }
  }, [isRevealed, showChat, lastFocusedGrade]);

  const handleGradeClick = (grade: number) => {
    setFocusedGrade(grade);
    onReview(grade);
  };

  const renderFlashcard = () => (
    <div className="w-full max-w-2xl flex flex-col items-center justify-center px-2 sm:px-0">
      <div className="w-full mb-2 sm:mb-4 text-xs sm:text-sm text-gray-600 text-center">
        {renderDeckInfo(card.decks)}
      </div>
      <div className="w-full bg-white p-4 sm:p-6">
        <div className={`text-lg sm:text-xl ${!isRevealed && 'text-center'} mb-4 sm:mb-6`}>
          <MarkdownRenderer content={card.front} />
        </div>
        {isRevealed && (
          <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
            <div className="text-base sm:text-lg">
              <MarkdownRenderer content={card.back} />
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
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4 sm:mt-8">
              {['Again', 'Hard', 'Good', 'Easy'].map((label, index) => {
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
                    <span className="text-[10px] sm:text-xs text-gray-500">{getNextReviewTime(grade)}</span>
                  </button>
                );
              })}
            </div>
            <div className="text-center mt-2 sm:mt-4 text-xs sm:text-sm text-gray-500">
              Use arrow keys to navigate, Space/Enter to select
            </div>
            <div className="flex justify-center mt-4 sm:mt-6">
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
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-104px)] flex flex-col">
      {showChat ? (
        <CardChatInterface card={card} isRevealed={isRevealed} onClose={() => setShowChat(false)} />
      ) : (
        <div className="flex-grow flex items-center justify-center px-2 sm:px-6">{renderFlashcard()}</div>
      )}
    </div>
  );
};

export default Flashcard;
