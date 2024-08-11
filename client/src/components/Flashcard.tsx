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

  const handleCloseChat = () => {
    setShowChat(false);
  };

  const renderFlashcard = () => (
    <div className="w-full max-w-2xl flex flex-col items-center justify-center">
      <div className="w-full mb-2 text-sm text-gray-500 text-center">{renderDeckInfo(card.decks)}</div>
      <div className="w-full p-6 bg-white rounded-lg">
        <div className="text-2xl mb-4 font-semibold flex justify-center">
          <MarkdownRenderer content={card.front} className="text-left w-full" />
        </div>
        {isRevealed && (
          <div className="mt-4 pt-2 border-t border-gray-200 w-full">
            <div className="text-xl flex justify-center">
              <MarkdownRenderer content={card.back} className="text-left w-full" />
            </div>
          </div>
        )}
        {!isRevealed ? (
          <div className="flex justify-center mt-4 space-x-4">
            <Tooltip text="Press Space/Enter">
              <button
                onClick={() => setIsRevealed(true)}
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
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
                className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Deep Dive
              </button>
            </Tooltip>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              {[
                { label: 'Again', grade: 1 },
                { label: 'Hard', grade: 2 },
                { label: 'Good', grade: 3 },
                { label: 'Easy', grade: 4 },
              ].map(({ label, grade }) => (
                <button
                  key={label}
                  onClick={() => handleGradeClick(grade)}
                  className={`px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors flex flex-col items-center ${
                    focusedGrade === grade ? 'ring-2 ring-gray-500' : ''
                  }`}
                  aria-pressed={focusedGrade === grade}
                >
                  <span>{label}</span>
                  <span className="text-xs mt-1 text-gray-500">{getNextReviewTime(grade)}</span>
                </button>
              ))}
            </div>
            <div className="text-center mt-2 text-sm text-gray-500">
              Use arrow keys to navigate, Space/Enter to select
            </div>
            <div className="flex justify-center mt-4">
              <Tooltip text="Press 'D'">
                <button
                  onClick={() => {
                    setLastFocusedGrade(focusedGrade);
                    setShowChat(true);
                  }}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
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
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {showChat ? (
        <CardChatInterface card={card} isRevealed={isRevealed} onClose={handleCloseChat} />
      ) : (
        <div className="flex-grow flex items-center justify-center px-6">{renderFlashcard()}</div>
      )}
    </div>
  );
};

export default Flashcard;
