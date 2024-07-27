// src/components/DeckCards.tsx
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCreateCard } from '../hooks/mutations/useCreateCard';
import { useCards } from '../hooks/useCards';
import CardTable from '../components/CardTable';
import { useDeleteCard } from '../hooks/mutations/useDeleteCard';
import { useDecks } from '../hooks/useDecks';

const DeckCards: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const [frontContent, setFrontContent] = useState('');
  const [backContent, setBackContent] = useState('');

  const { data: decks } = useDecks();
  const createCardMutation = useCreateCard();
  const {
    data: cards,
    isLoading: isLoadingCards,
    error: cardsError,
  } = useCards(deckId);
  const deleteCardMutation = useDeleteCard();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deckId) {
      createCardMutation.mutate(
        { front: frontContent, back: backContent, deckId },
        {
          onSuccess: () => {
            setFrontContent('');
            setBackContent('');
          },
        }
      );
    }
  };

  const handleDeleteCard = (cardId: string) => {
    if (deckId) {
      deleteCardMutation.mutate(
        { cardId, deckId },
        {
          onSuccess: () => {
            console.log('Card deleted successfully');
          },
          onError: (error) => {
            console.error('Failed to delete card:', error);
          },
        }
      );
    }
  };

  const deckName =
    decks?.find((deck) => deck.id === deckId)?.name || 'Loading...';

  return (
    <div className="w-full px-6 py-8">
      <h2 className="text-2xl font-bold mb-6">Cards in {deckName}</h2>

      <form onSubmit={handleSubmit} className="">
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-4 md:space-y-0">
          <div className="flex-1">
            <label
              htmlFor="front"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Front
            </label>
            <textarea
              id="front"
              value={frontContent}
              onChange={(e) => setFrontContent(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm resize-none p-2 focus:ring-black focus:border-black"
              rows={3}
              placeholder="Enter the front content of the card"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="back"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Back
            </label>
            <textarea
              id="back"
              value={backContent}
              onChange={(e) => setBackContent(e.target.value)}
              className="w-full border border-gray-300 rounded-md shadow-sm resize-none p-2 focus:ring-black focus:border-black"
              rows={3}
              placeholder="Enter the back content of the card"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition duration-150 ease-in-out"
            disabled={createCardMutation.isPending}
          >
            {createCardMutation.isPending ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Adding...
              </span>
            ) : (
              'Add card'
            )}
          </button>
        </div>
      </form>

      {createCardMutation.isError && (
        <div className="mt-4 text-red-600">
          Error creating card: {(createCardMutation.error as Error).message}
        </div>
      )}

      <div className="mt-8 w-full">
        <div className="w-full bg-white shadow overflow-hidden sm:rounded-lg">
          {isLoadingCards ? (
            <div className="px-4 py-5 sm:p-6">Loading cards...</div>
          ) : cardsError ? (
            <div className="px-4 py-5 sm:p-6">
              Error loading cards: {(cardsError as Error).message}
            </div>
          ) : cards && cards.length > 0 ? (
            <CardTable cards={cards} onDeleteCard={handleDeleteCard} />
          ) : (
            <div className="px-4 py-5 sm:p-6">No cards in this deck yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeckCards;
