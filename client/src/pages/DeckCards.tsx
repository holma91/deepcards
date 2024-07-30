// src/components/DeckCards.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateCard } from '../hooks/mutations/useCreateCard';
import CardTable from '../components/CardTable';
import { useDeleteCard } from '../hooks/mutations/useDeleteCard';
import { useDeleteDeck } from '../hooks/mutations/useDeleteDeck';
import { useDeck } from '../hooks/useDeck';
import { useUpdateDeckName } from '../hooks/mutations/useUpdateDeckName';
import { useDeckCards } from '../hooks/useDeckCards';
import CardPreview from '../components/CardPreview';
import MarkdownTextarea from '../components/MarkdownTextArea';
import { Card } from '../types';
import { useUpdateCard } from '../hooks/mutations/useUpdateCard';

const DeckCards: React.FC = () => {
  const navigate = useNavigate();
  const { deckId } = useParams() as { deckId: string };

  const [frontContent, setFrontContent] = useState('');
  const [backContent, setBackContent] = useState('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  const { data: deck, isLoading: isDeckLoading } = useDeck(deckId);
  const { data: cards, isLoading: isCardsLoading, error: cardsError } = useDeckCards(deckId);

  const createCardMutation = useCreateCard();
  const updateCardMutation = useUpdateCard();
  const deleteCardMutation = useDeleteCard();
  const deleteDeckMutation = useDeleteDeck();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deckId && deck) {
      if (editingCard) {
        updateCardMutation.mutate({
          id: editingCard.id,
          front: frontContent,
          back: backContent,
          deckId,
        });
      } else {
        createCardMutation.mutate({
          front: frontContent,
          back: backContent,
          deckName: deck.name,
          deckId,
        });
      }
      setFrontContent('');
      setBackContent('');
      setEditingCard(null);
    }
  };

  const handleSelectCard = (card: Card) => {
    setEditingCard(card);
    setFrontContent(card.front);
    setBackContent(card.back);
  };

  const handleCancel = () => {
    setEditingCard(null);
    setFrontContent('');
    setBackContent('');
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
    return <h2 className="text-2xl font-bold">Cards in {deck?.name || 'Unnamed Deck'}</h2>;
  };

  const renderCardForm = () => (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 mb-4">
      <div className="flex-1 flex flex-col">
        <MarkdownTextarea value={frontContent} onChange={setFrontContent} placeholder="Front (supports markdown)" />
        <div className="h-2"></div>
        <MarkdownTextarea value={backContent} onChange={setBackContent} placeholder="Back (supports markdown)" />
        <div className="h-2"></div>
        <div className="flex gap-2">
          {editingCard && (
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-150 ease-in-out"
            >
              Cancel
            </button>
          )}
          <button
            disabled={!frontContent || !backContent}
            type="submit"
            className={`${
              editingCard ? 'flex-1' : 'w-full'
            } px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition duration-150 ease-in-out`}
          >
            {editingCard ? 'Edit Card' : 'Add Card'}
          </button>
        </div>
      </div>
      <div className="flex-1">
        <CardPreview front={frontContent} back={backContent} />
      </div>
    </form>
  );

  const renderCardTable = () => {
    if (isCardsLoading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      );
    }
    if (cardsError) {
      return <div className="text-red-500">Error loading cards: {cardsError.message}</div>;
    }
    if (!cards || cards.length === 0) {
      return <div>No cards in this deck yet.</div>;
    }
    return <CardTable cards={cards} onDeleteCard={handleDeleteCard} onSelectCard={handleSelectCard} />;
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
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
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
      updateDeckNameMutation.mutate({ deckId, newName: newDeckName });
      onClose();
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        {!isConfirmingDelete ? (
          <>
            <h2 className="text-2xl font-bold mb-4">Deck Settings</h2>
            <div className="mb-4">
              <label htmlFor="deckName" className="block text-sm font-medium text-gray-700 mb-1">
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
            <p className="mb-6">Are you sure you want to delete the deck "{deckName}"? This action cannot be undone.</p>
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
