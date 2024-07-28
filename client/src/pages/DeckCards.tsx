// src/components/DeckCards.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateCard } from '../hooks/mutations/useCreateCard';
import { useCards } from '../hooks/useCards';
import CardTable from '../components/CardTable';
import { useDeleteCard } from '../hooks/mutations/useDeleteCard';
import { useDeleteDeck } from '../hooks/mutations/useDeleteDeck';
import { useDeck } from '../hooks/useDeck';
import { useUpdateDeckName } from '../hooks/mutations/useUpdateDeckName';

const DeckCards: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const [frontContent, setFrontContent] = useState('');
  const [backContent, setBackContent] = useState('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const { data: deck, isLoading: isDeckLoading } = useDeck(deckId);
  const createCardMutation = useCreateCard();
  const {
    data: cards,
    isLoading: isCardsLoading,
    error: cardsError,
  } = useCards(deckId);

  const deleteCardMutation = useDeleteCard();
  const navigate = useNavigate();
  const deleteDeckMutation = useDeleteDeck();

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

  const handleDeleteDeck = () => {
    if (deckId) {
      deleteDeckMutation.mutate(
        { deckId },
        {
          onSuccess: () => {
            setIsSettingsModalOpen(false);
            navigate('/cards');
          },
          onError: (error) => {
            console.error('Failed to delete deck:', error);
          },
        }
      );
    }
  };

  const renderDeckName = () => {
    if (isDeckLoading) {
      return <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>;
    }
    return (
      <h2 className="text-2xl font-bold">
        Cards in {deck?.name || 'Unnamed Deck'}
      </h2>
    );
  };

  const renderCardForm = () => (
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
      <div className="my-4 flex justify-end">
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
  );

  const renderCardTable = () => {
    if (isCardsLoading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="h-16 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      );
    }
    if (cardsError) {
      return (
        <div className="text-red-500">
          Error loading cards: {cardsError.message}
        </div>
      );
    }
    if (!cards || cards.length === 0) {
      return <div>No cards in this deck yet.</div>;
    }
    return <CardTable cards={cards} onDeleteCard={handleDeleteCard} />;
  };

  return (
    <div className="w-full px-6 py-8">
      <div className="flex justify-between items-center mb-6">
        {renderDeckName()}
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition duration-150 ease-in-out"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      {renderCardForm()}
      {renderCardTable()}

      {deck && (
        <DeckSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onDelete={handleDeleteDeck}
          deckId={deckId}
          deckName={deck.name}
        />
      )}
    </div>
  );
};

const DeckSettingsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  deckId: string | undefined;
  deckName: string;
}> = ({ isOpen, onClose, onDelete, deckId, deckName }) => {
  const [newDeckName, setNewDeckName] = useState(deckName);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const updateDeckNameMutation = useUpdateDeckName();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleRename = () => {
    if (deckId && newDeckName !== deckName) {
      updateDeckNameMutation.mutate(
        { deckId, newName: newDeckName },
        {
          onSuccess: () => {
            onClose();
          },
          onError: (error) => {
            console.error('Failed to rename deck:', error);
            // You might want to show an error message to the user here
          },
        }
      );
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        ref={modalRef}
        className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full"
      >
        {!isConfirmingDelete ? (
          <>
            <h2 className="text-2xl font-bold mb-4">Deck Settings</h2>
            <div className="mb-4">
              <label
                htmlFor="deckName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Deck Name
              </label>
              <input
                type="text"
                id="deckName"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-black focus:border-black"
              />
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setIsConfirmingDelete(true)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-300"
              >
                Delete Deck
              </button>
              <div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-300 mr-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRename}
                  className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition duration-300"
                >
                  Save
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">Delete Deck</h2>
            <p className="mb-6">
              Are you sure you want to delete the deck "{deckName}"? This action
              cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsConfirmingDelete(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition duration-300"
              >
                Cancel
              </button>
              <button
                onClick={onDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition duration-300"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DeckCards;
