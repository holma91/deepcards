import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import '../../markdown.css';
import { useDecks } from '../../hooks/useDecks';
import { Deck } from '../../types';

interface FlashcardReviewModalProps {
  cards: Array<{ front: string; back: string }>;
  currentIndex: number;
  onClose: () => void;
  onAddToDeck: (card: { front: string; back: string }, deckId: string) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const FlashcardReviewModal: React.FC<FlashcardReviewModalProps> = ({
  cards,
  currentIndex,
  onClose,
  onAddToDeck,
  onNext,
  onPrevious,
}) => {
  const currentCard = cards[currentIndex];
  const { data: decks, isLoading, isError } = useDecks();
  const [selectedDeckId, setSelectedDeckId] = useState<string>('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const renderProgressDots = () => {
    return cards.map((_, index) => (
      <span
        key={index}
        className={`inline-block w-2 h-2 rounded-full mx-1 ${index === currentIndex ? 'bg-black' : 'bg-gray-300'}`}
      ></span>
    ));
  };

  const handleAddToDeck = () => {
    if (selectedDeckId) {
      onAddToDeck(currentCard, selectedDeckId);
      setSelectedDeckId('');
    }
  };

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
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onPrevious}
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
                <ReactMarkdown>{currentCard.front}</ReactMarkdown>
              </div>
            </div>
            <div className="w-full h-px bg-gray-200 my-4"></div>
            <div className="max-h-60 overflow-y-auto">
              <div className="markdown-content">
                <ReactMarkdown>{currentCard.back}</ReactMarkdown>
              </div>
            </div>
          </div>
          <button
            onClick={onNext}
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
        <div className="flex justify-center my-6">{renderProgressDots()}</div>
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
        {isLoading && <p className="text-center mt-2">Loading decks...</p>}
        {isError && <p className="text-center mt-2 text-red-500">Error loading decks</p>}
      </div>
    </div>
  );
};

export default FlashcardReviewModal;
