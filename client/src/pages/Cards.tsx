import React, { useState, useEffect } from 'react';
import { useDecks } from '../hooks/useDecks';
import { useCreateCard } from '../hooks/mutations/useCreateCard';
import { useCards } from '../hooks/useCards';
import CardTable from '../components/CardTable';
import { useDeleteCard } from '../hooks/mutations/useDeleteCard';
import { useCreateDeck } from '../hooks/mutations/useCreateDeck';
import { v4 as uuidv4 } from 'uuid';

const Cards: React.FC = () => {
  const [isManual, setIsManual] = useState(true);
  const [selectedDeck, setSelectedDeck] = useState<string>('');
  const [frontContent, setFrontContent] = useState('');
  const [backContent, setBackContent] = useState('');
  const [newDeckName, setNewDeckName] = useState('');
  const [isCreatingNewDeck, setIsCreatingNewDeck] = useState(false);

  const {
    data: decks,
    isLoading: isLoadingDecks,
    error: decksError,
  } = useDecks();
  const createCardMutation = useCreateCard();
  const {
    data: cards,
    isLoading: isLoadingCards,
    error: cardsError,
  } = useCards(selectedDeck);
  const deleteCardMutation = useDeleteCard();
  const createDeckMutation = useCreateDeck();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDeck) {
      createCardMutation.mutate(
        { front: frontContent, back: backContent, deckId: selectedDeck },
        {
          onSuccess: () => {
            setFrontContent('');
            setBackContent('');
          },
        }
      );
    }
  };

  useEffect(() => {
    if (decks && decks.length > 0 && !selectedDeck) {
      setSelectedDeck(decks[0].id);
    }
  }, [decks, selectedDeck]);

  const handleCreateDeck = () => {
    if (newDeckName.trim()) {
      const newDeckId = uuidv4();
      createDeckMutation.mutate(
        { id: newDeckId, name: newDeckName.trim() },
        {
          onSuccess: (newDeck) => {
            setSelectedDeck(newDeck.id);
            setNewDeckName('');
            setIsCreatingNewDeck(false);
          },
        }
      );
    }
  };

  const handleCancelNewDeck = () => {
    setIsCreatingNewDeck(false);
    setNewDeckName('');
  };

  const handleDeleteCard = (cardId: string) => {
    if (selectedDeck) {
      deleteCardMutation.mutate(
        { cardId, deckId: selectedDeck },
        {
          onSuccess: () => {
            // You could add a toast notification here if you want
            console.log('Card deleted successfully');
          },
          onError: (error) => {
            console.error('Failed to delete card:', error);
            // You could add an error notification here
          },
        }
      );
    }
  };

  if (isLoadingDecks) return <div>Loading decks...</div>;
  if (decksError)
    return <div>Error loading decks: {(decksError as Error).message}</div>;

  const selectedDeckName =
    decks?.find((deck) => deck.id === selectedDeck)?.name || 'Selected Deck';

  return (
    <div className="w-full px-6 py-8">
      <div className="flex mb-4">
        <button
          className={`px-4 py-2 rounded-l ${
            isManual ? 'bg-gray-800 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setIsManual(true)}
        >
          manually
        </button>
        <button
          className={`px-4 py-2 rounded-r bg-gray-200 text-gray-400 cursor-not-allowed`}
          disabled
        >
          automatically
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex space-x-4">
          <div className="flex-1">
            <label
              htmlFor="front"
              className="block text-sm font-medium text-gray-700"
            >
              Front
            </label>
            <textarea
              id="front"
              value={frontContent}
              onChange={(e) => setFrontContent(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm resize-none p-2"
              rows={3}
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="back"
              className="block text-sm font-medium text-gray-700"
            >
              Back
            </label>
            <textarea
              id="back"
              value={backContent}
              onChange={(e) => setBackContent(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm resize-none p-2"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-center items-center space-x-4">
          {isCreatingNewDeck ? (
            <>
              <input
                type="text"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                placeholder="New deck name"
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ height: '42px' }}
                autoFocus
              />
              <button
                onClick={handleCreateDeck}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-32"
                disabled={createDeckMutation.isPending}
              >
                {createDeckMutation.isPending ? 'Adding...' : 'Add Deck'}
              </button>
              <button
                onClick={handleCancelNewDeck}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 w-32"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <div className="relative inline-block w-64">
                <select
                  value={selectedDeck}
                  onChange={(e) => {
                    if (e.target.value === 'new') {
                      setIsCreatingNewDeck(true);
                    } else {
                      setSelectedDeck(e.target.value);
                    }
                  }}
                  className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  style={{ height: '42px' }}
                >
                  <option value="new">+ New Deck</option>
                  {decks?.map((deck) => (
                    <option key={deck.id} value={deck.id}>
                      {deck.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-32"
                disabled={createCardMutation.isPending}
              >
                {createCardMutation.isPending ? 'Adding...' : 'Add card'}
              </button>
            </>
          )}
        </div>
      </form>

      {createCardMutation.isError && (
        <div className="mt-4 text-red-600">
          Error creating card: {(createCardMutation.error as Error).message}
        </div>
      )}

      <div className="mt-8 w-full">
        <h3 className="text-lg font-medium mb-4">
          Cards in {isCreatingNewDeck ? 'New Deck' : selectedDeckName}
        </h3>
        <div className="w-full bg-white shadow overflow-hidden sm:rounded-lg">
          {isCreatingNewDeck ? (
            <div className="px-4 py-5 sm:p-6">
              Create a new deck to add cards
            </div>
          ) : isLoadingCards && !cards ? (
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

export default Cards;
