import React, { useState } from 'react';
import Flashcard from './Flashcard';
import { Deck } from '../types';

interface ReviewSessionProps {
  deck: Deck;
}

const ReviewSession: React.FC<ReviewSessionProps> = ({ deck }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const handleNextCard = () => {
    setCurrentCardIndex((prevIndex) =>
      prevIndex + 1 >= deck.cards.length ? 0 : prevIndex + 1
    );
  };

  return (
    <div className="flex flex-col items-center space-y-6">
      <h2 className="text-2xl font-bold">{deck.name}</h2>
      <Flashcard card={deck.cards[currentCardIndex]} />
      <button
        onClick={handleNextCard}
        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
      >
        Next Card
      </button>
    </div>
  );
};

export default ReviewSession;
