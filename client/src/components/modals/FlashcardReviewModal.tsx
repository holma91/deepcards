// src/components/modals/FlashcardReviewModal.tsx

import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import '../../markdown.css';
import { useDecks } from '../../hooks/useDecks';
import { Deck } from '../../types';
import { useCreateCard } from '../../hooks/mutations/useCreateCard';

interface FlashcardReviewModalProps {
  cards: Array<{ front: string; back: string }>;
  chatId: string; // Add this prop
  onClose: () => void;
}

const FlashcardReviewModal: React.FC<FlashcardReviewModalProps> = ({ cards, chatId, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { data: decks } = useDecks();
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');

  interface AddedCardInfo {
    deckName: string;
    cardIndex: number;
  }

  const [addedCards, setAddedCards] = useState<AddedCardInfo[]>([]);

  const createCardMutation = useCreateCard();

  const handleNextCard = () => {
    if (cards.length > 0 && currentIndex < cards.length - 1) {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }
  };

  const handlePreviousCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prevIndex) => prevIndex - 1);
    }
  };

  const handleAddToDeck = async () => {
    if (selectedDeckId && cards[currentIndex]) {
      const selectedDeck = decks?.find((deck) => deck.id === selectedDeckId);
      if (!selectedDeck) {
        console.error('Selected deck not found');
        return;
      }

      try {
        await createCardMutation.mutateAsync({
          front: cards[currentIndex].front,
          back: cards[currentIndex].back,
          deckId: selectedDeckId,
          deckName: selectedDeck.name,
          chatId: chatId, // Add this
        });

        setAddedCards((prev) => [...prev, { deckName: selectedDeck.name, cardIndex: currentIndex }]);
        setSelectedDeckId('');
      } catch (error) {
        console.error('Failed to add card to deck:', error);
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowRight') {
        handleNextCard();
      } else if (event.key === 'ArrowLeft') {
        handlePreviousCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, handleNextCard, handlePreviousCard]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Generated Flashcards</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {cards.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePreviousCard}
                disabled={currentIndex === 0}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-full max-w-2xl mx-auto px-4">
                <div className="mb-4 max-h-60 overflow-y-auto">
                  <div className="markdown-content">
                    <ReactMarkdown>{cards[currentIndex].front}</ReactMarkdown>
                  </div>
                </div>
                <div className="w-full h-px bg-gray-200 my-4"></div>
                <div className="max-h-60 overflow-y-auto">
                  <div className="markdown-content">
                    <ReactMarkdown>{cards[currentIndex].back}</ReactMarkdown>
                  </div>
                </div>
              </div>
              <button
                onClick={handleNextCard}
                disabled={currentIndex === cards.length - 1}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="flex justify-center my-6">
              {cards.map((_, index) => (
                <span
                  key={index}
                  className={`inline-block w-2 h-2 rounded-full mx-1 ${
                    index === currentIndex ? 'bg-black' : 'bg-gray-300'
                  }`}
                ></span>
              ))}
            </div>
            <div className="flex flex-col items-center space-y-4">
              {addedCards.find((card) => card.cardIndex === currentIndex) ? (
                <div className="text-green-600 font-semibold">
                  Card added to "{addedCards.find((card) => card.cardIndex === currentIndex)?.deckName}"
                </div>
              ) : (
                <div className="flex justify-center items-center space-x-2">
                  <select
                    value={selectedDeckId}
                    onChange={(e) => setSelectedDeckId(e.target.value)}
                    className="w-64 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-black"
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
                </div>
              )}
            </div>
          </>
        )}
        {cards.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-black"></div>
            <p className="text-gray-600 font-medium">Generating flashcards...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardReviewModal;
