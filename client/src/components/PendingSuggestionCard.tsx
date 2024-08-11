import React, { useState } from 'react';
import { Deck, Suggestion } from '../types';
import { useDecks } from '../hooks/useDecks';
import { useAcceptSuggestion } from '../hooks/mutations/useAcceptSuggestion';
import { useUpdateSuggestion } from '../hooks/mutations/useUpdateSuggestion';
import MarkdownRenderer from './MarkdownRenderer';

interface PendingSuggestionCardProps {
  suggestion: Suggestion;
  chatId: string;
  onNextSuggestion: () => void;
}

const PendingSuggestionCard: React.FC<PendingSuggestionCardProps> = ({ suggestion, chatId, onNextSuggestion }) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const { data: decks } = useDecks();
  const acceptSuggestionMutation = useAcceptSuggestion();
  const updateSuggestionMutation = useUpdateSuggestion();

  const handleAddToDeck = () => {
    if (selectedDeckId) {
      const selectedDeck = decks?.find((deck) => deck.id === selectedDeckId);
      if (!selectedDeck) return;

      acceptSuggestionMutation.mutate({
        suggestionId: suggestion.id,
        deckId: selectedDeckId,
        deckName: selectedDeck.name,
        chatId: chatId,
      });

      onNextSuggestion();
    }
  };

  const handleReject = () => {
    updateSuggestionMutation.mutate({
      suggestionId: suggestion.id,
      status: 'rejected',
    });

    onNextSuggestion();
  };

  return (
    <div className="w-full my-4">
      <div className="border border-gray-300 rounded-md overflow-hidden">
        <div className="p-4 bg-white">
          <div className="mb-2">
            <strong>Front:</strong>
            <MarkdownRenderer content={suggestion.front} className="mt-1" />
          </div>
          <div className="mb-4">
            <strong>Back:</strong>
            <MarkdownRenderer content={suggestion.back} className="mt-1" />
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedDeckId}
              onChange={(e) => setSelectedDeckId(e.target.value)}
              className="flex-grow px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
            >
              <option value="">Select a deck</option>
              {decks?.map((deck: Deck) => (
                <option key={deck.id} value={deck.id}>
                  {deck.name}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddToDeck}
              disabled={!selectedDeckId}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add to Deck
            </button>
            <button onClick={handleReject} className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingSuggestionCard;
