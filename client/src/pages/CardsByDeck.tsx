// src/components/DeckCards.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCreateCard } from '../hooks/mutations/useCreateCard';
import CardTable from '../components/CardTable';
import { useDeleteCard } from '../hooks/mutations/useDeleteCard';
import { useDeleteDeck } from '../hooks/mutations/useDeleteDeck';
import { useDeck } from '../hooks/useDeck';
import { useDeckCards } from '../hooks/useDeckCards';
import CardPreview from '../components/CardPreview';
import MarkdownTextarea from '../components/MarkdownTextArea';
import { Card } from '../types';
import { useUpdateCard } from '../hooks/mutations/useUpdateCard';
import DeckSettingsModal from '../components/modals/DeckSettingsModal';
import { useAllCards } from '../hooks/useAllCards';

const CardsByDeck: React.FC = () => {
  const navigate = useNavigate();
  const { deckId } = useParams<{ deckId?: string }>();

  const [frontContent, setFrontContent] = useState('');
  const [backContent, setBackContent] = useState('');
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Card | null>(null);

  const frontTextareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: deck, isLoading: isDeckLoading } = useDeck(deckId);
  const { data: deckCards, isLoading: isDeckCardsLoading, error: deckCardsError } = useDeckCards(deckId);
  const { data: allCards, isLoading: isAllCardsLoading, error: allCardsError } = useAllCards();

  const cards = deckId ? deckCards : allCards;
  const isCardsLoading = deckId ? isDeckCardsLoading : isAllCardsLoading;
  const cardsError = deckId ? deckCardsError : allCardsError;

  const createCardMutation = useCreateCard();
  const updateCardMutation = useUpdateCard();
  const deleteCardMutation = useDeleteCard();
  const deleteDeckMutation = useDeleteDeck();

  const handleSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    if (editingCard) {
      updateCardMutation.mutate({
        id: editingCard.id,
        front: frontContent,
        back: backContent,
        deckId: deckId || undefined,
      });
    } else if (deckId && deck) {
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

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      handleSubmit(event as any);
      if (frontTextareaRef.current) {
        frontTextareaRef.current.focus();
      }
    }
  };

  const handleDeleteCard = (cardId: string) => {
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

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && editingCard) {
        handleCancel();
      }
    };

    if (editingCard) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [editingCard]);

  useEffect(() => {
    if (editingCard && frontTextareaRef.current) {
      frontTextareaRef.current.focus();
    }
  }, [editingCard]);

  const renderDeckName = () => {
    if (deckId) {
      if (isDeckLoading) {
        return <div className="h-6 sm:h-8 w-32 sm:w-48 bg-gray-200 rounded animate-pulse"></div>;
      }
      return <h2 className="text-xl sm:text-2xl font-bold truncate">Cards in {deck?.name || 'Unnamed Deck'}</h2>;
    }
    return <h2 className="text-xl sm:text-2xl font-bold truncate">All Cards</h2>;
  };

  const renderCardForm = () => {
    // Don't render the form if there's no deckId and we're not editing
    if (!deckId && !editingCard) return null;

    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex flex-col gap-2">
            <MarkdownTextarea
              ref={frontTextareaRef}
              value={frontContent}
              onChange={setFrontContent}
              placeholder="Front (supports markdown)"
              onKeyDown={handleKeyDown}
            />
            <MarkdownTextarea
              value={backContent}
              onChange={setBackContent}
              placeholder="Back (supports markdown)"
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="flex-1">
            <CardPreview front={frontContent} back={backContent} />
          </div>
        </div>
        <div className="flex gap-2">
          {editingCard && (
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            disabled={!frontContent || !backContent}
            type="submit"
            className={`${
              editingCard ? 'flex-1' : 'w-full'
            } px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {editingCard ? 'Save Changes' : 'Add Card'}
          </button>
        </div>
      </form>
    );
  };

  const renderCardTable = () => {
    if (isCardsLoading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="h-12 sm:h-16 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      );
    }
    if (cardsError) {
      return <div className="text-red-500 text-sm sm:text-base">Error loading cards: {cardsError.message}</div>;
    }
    if (!cards || cards.length === 0) {
      return <div className="text-gray-500 text-sm sm:text-base">No cards found.</div>;
    }
    return <CardTable cards={cards} onDeleteCard={handleDeleteCard} onSelectCard={handleSelectCard} />;
  };

  return (
    <div className="w-full px-4 sm:px-6 py-4 sm:py-8">
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        {renderDeckName()}
        {deckId && (
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        )}
      </div>

      {renderCardForm()}
      {renderCardTable()}

      {deckId && deck && (
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

export default CardsByDeck;
