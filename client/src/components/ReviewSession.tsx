import React, { useState } from 'react';
import Flashcard from './Flashcard';
import { useCards } from '../hooks/useCards';

const ReviewSession: React.FC = () => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const { isPending, isError, data: cards, error } = useCards();

  const handleNextCard = () => {
    if (cards) {
      setCurrentCardIndex((prevIndex) =>
        prevIndex + 1 >= cards.length ? 0 : prevIndex + 1
      );
    }
  };

  if (isPending) return <div>Loading...</div>;
  if (isError) return <div>An error occurred: {error?.message}</div>;
  if (!cards || cards.length === 0) return <div>No cards found</div>;

  return (
    <div className="flex flex-col items-center space-y-6">
      <h2 className="text-2xl font-bold">Review Session</h2>
      <Flashcard card={cards[currentCardIndex]} />
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
