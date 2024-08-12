import React from 'react';
import CardTable from '../components/CardTable';
import { useAllCards } from '../hooks/useAllCards';

const Cards: React.FC = () => {
  const { data: cards, isLoading: isLoadingCards, error: cardsError } = useAllCards();

  const handleDeleteCard = () => {
    console.log('delete card');
  };

  const handleSelectCard = () => {
    console.log('select card');
  };

  return (
    <div className="w-full px-4 sm:px-6 py-4 sm:py-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">All Cards</h2>

      <div className="w-full bg-white overflow-hidden sm:rounded-lg">
        {isLoadingCards ? (
          <div className="px-3 py-4 sm:px-4 sm:py-5">Loading cards...</div>
        ) : cardsError ? (
          <div className="px-3 py-4 sm:px-4 sm:py-5 text-red-600">
            Error loading cards: {(cardsError as Error).message}
          </div>
        ) : cards && cards.length > 0 ? (
          <CardTable cards={cards} onDeleteCard={handleDeleteCard} onSelectCard={handleSelectCard} />
        ) : (
          <div className="px-3 py-4 sm:px-4 sm:py-5">No cards found.</div>
        )}
      </div>
    </div>
  );
};

export default Cards;
