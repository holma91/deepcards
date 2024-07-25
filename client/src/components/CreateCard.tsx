import React, { useState, useEffect } from 'react';
import { useDecks } from '../hooks/useDecks';
import { useCreateCard } from '../hooks/useCreateCard';
import { useCards, Card } from '../hooks/useCards';

const CreateCard: React.FC = () => {
  const [isManual, setIsManual] = useState(true);
  const [selectedDeck, setSelectedDeck] = useState<string>('');
  const [frontContent, setFrontContent] = useState('');
  const [backContent, setBackContent] = useState('');

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

  if (isLoadingDecks) return <div>Loading decks...</div>;
  if (decksError)
    return <div>Error loading decks: {(decksError as Error).message}</div>;

  return (
    <div className="max-w-4xl mx-auto">
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
          className={`px-4 py-2 rounded-r ${
            !isManual ? 'bg-gray-800 text-white' : 'bg-gray-200'
          }`}
          onClick={() => setIsManual(false)}
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm resize-none"
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-center items-center space-x-4">
          <select
            value={selectedDeck}
            onChange={(e) => setSelectedDeck(e.target.value)}
            className="block w-64 bg-white border border-gray-300 rounded-md shadow-sm"
          >
            {decks?.map((deck) => (
              <option key={deck.id} value={deck.id}>
                {deck.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={createCardMutation.isPending}
          >
            {createCardMutation.isPending ? 'Adding...' : 'Add card'}
          </button>
        </div>
      </form>

      {createCardMutation.isError && (
        <div className="mt-4 text-red-600">
          Error creating card: {(createCardMutation.error as Error).message}
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Cards in selected deck</h3>
        {isLoadingCards && !cards ? (
          <div>Loading cards...</div>
        ) : cardsError ? (
          <div>Error loading cards: {(cardsError as Error).message}</div>
        ) : cards && cards.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {cards.map((card: Card) => (
              <li key={card.id} className="py-4">
                <div className="flex justify-between">
                  <div className="text-sm font-medium text-gray-900">
                    {card.front}
                  </div>
                  <div className="text-sm text-gray-500">{card.back}</div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Created: {new Date(card.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div>No cards in this deck yet.</div>
        )}
      </div>
    </div>
  );
};

export default CreateCard;
