// src/components/Cards.tsx
import React, { useState } from 'react';
import { useCards } from '../hooks/useCards';
import CardTable from '../components/CardTable';
import { useDeleteCard } from '../hooks/mutations/useDeleteCard';

const Cards: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: cards,
    isLoading: isLoadingCards,
    error: cardsError,
  } = useCards(); // This now fetches cards from all decks
  const deleteCardMutation = useDeleteCard();

  const handleDeleteCard = (cardId: string) => {
    deleteCardMutation.mutate(
      { cardId },
      {
        onSuccess: () => {
          console.log('Card deleted successfully');
        },
        onError: (error) => {
          console.error('Failed to delete card:', error);
        },
      }
    );
  };

  const filteredCards = cards?.filter(
    (card) =>
      card.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.back.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full px-6 py-8">
      <h2 className="text-2xl font-bold mb-6">All Cards</h2>

      <div className="w-full bg-white shadow overflow-hidden sm:rounded-lg">
        {isLoadingCards ? (
          <div className="px-4 py-5 sm:p-6">Loading cards...</div>
        ) : cardsError ? (
          <div className="px-4 py-5 sm:p-6">
            Error loading cards: {(cardsError as Error).message}
          </div>
        ) : filteredCards && filteredCards.length > 0 ? (
          <CardTable cards={filteredCards} onDeleteCard={handleDeleteCard} />
        ) : (
          <div className="px-4 py-5 sm:p-6">No cards found.</div>
        )}
      </div>
    </div>
  );
};

export default Cards;
