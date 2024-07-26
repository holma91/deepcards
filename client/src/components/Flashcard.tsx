import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../types';

interface FlashcardProps {
  card: Card;
  onReview: (grade: number) => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ card, onReview }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [focusedGrade, setFocusedGrade] = useState<number | null>(null);
  const showAnswerRef = useRef<HTMLButtonElement>(null);
  const goodButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        if (!isRevealed) {
          setIsRevealed(true);
        } else if (focusedGrade !== null) {
          onReview(focusedGrade);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [isRevealed, onReview, focusedGrade]);

  useEffect(() => {
    if (!isRevealed && showAnswerRef.current) {
      showAnswerRef.current.focus();
    } else if (isRevealed && goodButtonRef.current) {
      goodButtonRef.current.focus();
      setFocusedGrade(3);
    }
  }, [isRevealed]);

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

  const handleFocus = (grade: number) => {
    setFocusedGrade(grade);
  };

  const handleBlur = () => {
    setFocusedGrade(null);
  };

  return (
    <div className="w-full max-w-2xl flex flex-col items-center justify-center">
      <div className="w-full p-6 bg-white rounded-lg">
        <p className="text-2xl mb-4 font-semibold text-center">{card.front}</p>
        {isRevealed && (
          <>
            <div className="mt-4 pt-4 border-t border-gray-200 w-full">
              <p className="text-xl text-center">{card.back}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              {[
                { label: 'Again', grade: 1 },
                { label: 'Hard', grade: 2 },
                { label: 'Good', grade: 3 },
                { label: 'Easy', grade: 4 },
              ].map(({ label, grade }) => (
                <button
                  key={label}
                  onClick={() => onReview(grade)}
                  ref={label === 'Good' ? goodButtonRef : null}
                  onFocus={() => handleFocus(grade)}
                  onBlur={handleBlur}
                  className={`px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors flex flex-col items-center focus:outline-none ${
                    focusedGrade === grade ? 'ring-2 ring-gray-500' : ''
                  }`}
                >
                  <span>{label}</span>
                  <span className="text-xs mt-1 text-gray-500">
                    {getNextReviewTime(grade)}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      {!isRevealed && (
        <button
          ref={showAnswerRef}
          onClick={() => setIsRevealed(true)}
          className="mt-4 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Show Answer (Space)
        </button>
      )}
    </div>
  );
};

export default Flashcard;
