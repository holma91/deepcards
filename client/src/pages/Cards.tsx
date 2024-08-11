// src/components/Cards.tsx
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
    <div className="w-full px-6 py-8">
      <h2 className="text-2xl font-bold mb-6">All Cards</h2>

      <div className="w-full bg-white overflow-hidden sm:rounded-lg">
        {isLoadingCards ? (
          <div className="px-4 py-5 sm:p-6">Loading cards...</div>
        ) : cardsError ? (
          <div className="px-4 py-5 sm:p-6">Error loading cards: {(cardsError as Error).message}</div>
        ) : cards && cards.length > 0 ? (
          <CardTable cards={cards} onDeleteCard={handleDeleteCard} onSelectCard={handleSelectCard} />
        ) : (
          <div className="px-4 py-5 sm:p-6">No cards found.</div>
        )}
      </div>
    </div>
  );
};

export default Cards;
