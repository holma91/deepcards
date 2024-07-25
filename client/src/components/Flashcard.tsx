import React, { useState } from 'react';
import { Flashcard as FlashcardType } from '../types';

interface FlashcardProps {
  card: FlashcardType;
}

const Flashcard: React.FC<FlashcardProps> = ({ card }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="w-full max-w-lg h-64 bg-white border border-black cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className="h-full flex items-center justify-center p-6 text-center">
        <p className="text-xl">{isFlipped ? card.back : card.front}</p>
      </div>
    </div>
  );
};

export default Flashcard;
