import React, { useState } from 'react';
import { Card } from '../types';

interface FlashcardProps {
  card: Card;
  onReview: (grade: number) => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ card, onReview }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className="w-full max-w-lg bg-white border border-gray-200 rounded-lg shadow-md">
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <p className="text-xl mb-4 font-semibold">{card.front}</p>
        {isRevealed ? (
          <>
            <div className="mt-4 pt-4 border-t border-gray-200 w-full">
              <p className="text-lg">{card.back}</p>
            </div>
            <div className="flex space-x-4 mt-6">
              {['Again', 'Hard', 'Good', 'Easy'].map((label, index) => (
                <button
                  key={label}
                  onClick={() => onReview(index + 1)}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-100 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        ) : (
          <button
            onClick={() => setIsRevealed(true)}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors"
          >
            Show Answer
          </button>
        )}
      </div>
    </div>
  );
};

export default Flashcard;
