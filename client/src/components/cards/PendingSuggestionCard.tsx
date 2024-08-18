import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Deck, Suggestion } from '../../types';
import { useDecks } from '../../hooks/queries/useDecks';
import { useAcceptSuggestion } from '../../hooks/mutations/useAcceptSuggestion';
import { useUpdateSuggestion } from '../../hooks/mutations/useUpdateSuggestion';
import { useCreateDeck } from '../../hooks/mutations/useCreateDeck';
import MarkdownRenderer from '../common/MarkdownRenderer';
import MarkdownTextArea from '../common/MarkdownTextArea';

interface PendingSuggestionCardProps {
  suggestion: Suggestion;
  chatId: string;
}

const PendingSuggestionCard: React.FC<PendingSuggestionCardProps> = ({ suggestion, chatId }) => {
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');
  const [newDeckName, setNewDeckName] = useState<string>('');
  const [isCreatingNewDeck, setIsCreatingNewDeck] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedFront, setEditedFront] = useState<string>(suggestion.modified_front || suggestion.front);
  const [editedBack, setEditedBack] = useState<string>(suggestion.modified_back || suggestion.back);

  const { data: decks } = useDecks();
  const acceptSuggestionMutation = useAcceptSuggestion();
  const updateSuggestionMutation = useUpdateSuggestion();
  const createDeckMutation = useCreateDeck();

  const newDeckInputRef = useRef<HTMLInputElement>(null);
  const frontTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isCreatingNewDeck && newDeckInputRef.current) {
      newDeckInputRef.current.focus();
    }
  }, [isCreatingNewDeck]);

  useEffect(() => {
    if (isEditing && frontTextareaRef.current) {
      frontTextareaRef.current.focus();
    }
  }, [isEditing]);

  const handleAddToDeck = () => {
    if (isCreatingNewDeck && newDeckName.trim()) {
      const newDeckId = uuidv4();
      createDeckMutation.mutate(
        { id: newDeckId, name: newDeckName.trim() },
        {
          onSuccess: () => {
            acceptSuggestionMutation.mutate({
              suggestionId: suggestion.id,
              deckId: newDeckId,
              deckName: newDeckName.trim(),
              chatId: chatId,
            });
            setIsCreatingNewDeck(false);
            setNewDeckName('');
            setSelectedDeckId(newDeckId);
          },
        }
      );
    } else if (selectedDeckId) {
      const selectedDeck = decks?.find((deck) => deck.id === selectedDeckId);
      if (!selectedDeck) return;

      acceptSuggestionMutation.mutate({
        suggestionId: suggestion.id,
        deckId: selectedDeckId,
        deckName: selectedDeck.name,
        chatId: chatId,
      });
    }
  };

  const handleReject = () => {
    updateSuggestionMutation.mutate({
      suggestionId: suggestion.id,
      status: 'rejected',
      chatId: chatId,
    });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'new') {
      setIsCreatingNewDeck(true);
      setSelectedDeckId('');
    } else {
      setIsCreatingNewDeck(false);
      setSelectedDeckId(value);
    }
  };

  const handleCancelNewDeck = () => {
    setIsCreatingNewDeck(false);
    setNewDeckName('');
    setSelectedDeckId('');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    updateSuggestionMutation.mutate(
      {
        suggestionId: suggestion.id,
        chatId: chatId,
        modified_front: editedFront,
        modified_back: editedBack,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleCancel = () => {
    setEditedFront(suggestion.modified_front || suggestion.front);
    setEditedBack(suggestion.modified_back || suggestion.back);
    setIsEditing(false);
  };

  return (
    <div className="w-full my-2 sm:my-4">
      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-3 sm:p-4 bg-white">
          <div className="mb-3 sm:mb-4">
            <strong className="text-sm sm:text-base text-gray-700">Front:</strong>
            <div className="mt-1 text-sm sm:text-base">
              {isEditing ? (
                <MarkdownTextArea
                  ref={frontTextareaRef}
                  value={editedFront}
                  onChange={setEditedFront}
                  placeholder="Front (supports markdown)"
                />
              ) : (
                <MarkdownRenderer content={suggestion.modified_front || suggestion.front} />
              )}
            </div>
          </div>
          <div className="mb-4 sm:mb-6">
            <strong className="text-sm sm:text-base text-gray-700">Back:</strong>
            <div className="mt-1 text-sm sm:text-base">
              {isEditing ? (
                <MarkdownTextArea value={editedBack} onChange={setEditedBack} placeholder="Back (supports markdown)" />
              ) : (
                <MarkdownRenderer content={suggestion.modified_back || suggestion.back} />
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors duration-200 text-sm sm:text-base"
                >
                  Save
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 text-sm sm:text-base"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                {isCreatingNewDeck ? (
                  <div className="flex-1 flex items-center space-x-2">
                    <input
                      ref={newDeckInputRef}
                      type="text"
                      value={newDeckName}
                      onChange={(e) => setNewDeckName(e.target.value)}
                      placeholder="Enter new deck name"
                      className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-base"
                    />
                    <button
                      onClick={handleCancelNewDeck}
                      className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedDeckId}
                    onChange={handleSelectChange}
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 text-sm sm:text-base"
                  >
                    <option value="">Select a deck</option>
                    <option value="new">Create new deck</option>
                    {decks?.map((deck: Deck) => (
                      <option key={deck.id} value={deck.id}>
                        {deck.name}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  onClick={handleAddToDeck}
                  disabled={(!selectedDeckId && !isCreatingNewDeck) || (isCreatingNewDeck && !newDeckName.trim())}
                  className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm sm:text-base"
                >
                  Add to Deck
                </button>
                <button
                  onClick={handleReject}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 text-sm sm:text-base"
                >
                  Reject
                </button>
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors duration-200 text-sm sm:text-base"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingSuggestionCard;
