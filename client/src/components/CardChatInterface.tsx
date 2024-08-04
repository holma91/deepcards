import React, { useState, useEffect } from 'react';
import BaseChatInterface from './BaseChatInterface';
import { Card, Message } from '../types';
import FlashcardReviewModal from './modals/FlashcardReviewModal';
import ReactMarkdown from 'react-markdown';
import renderDeckInfo from '../utils/renderDeckInfo';

interface CardChatInterfaceProps {
  card: Card;
  isRevealed: boolean;
  onClose: () => void;
}

const CardChatInterface: React.FC<CardChatInterfaceProps> = ({ card, isRevealed, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [generatedCards, setGeneratedCards] = useState<Array<{ front: string; back: string }>>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !showModal) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showModal]);

  const handleSendMessage = (message: string) => {
    console.log('Sending message:', message);
    console.log('Card content:', card);
    console.log('Is card revealed:', isRevealed);

    // For now, just add the message to the local state
    const userMessage: Message = { role: 'user', content: message };
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    // Dummy response
    setTimeout(() => {
      const assistantMessage: Message = { role: 'assistant', content: 'This is a dummy response.' };
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    }, 500);
  };

  const handleGenerateFlashcards = () => {
    console.log('Generate flashcards clicked');
    // Dummy implementation
    const dummyCards = [
      { front: 'Dummy front 1', back: 'Dummy back 1' },
      { front: 'Dummy front 2', back: 'Dummy back 2' },
    ];
    setGeneratedCards(dummyCards);
    setCurrentCardIndex(0);
    setShowModal(true);
  };

  const handleAddToDeck = (card: { front: string; back: string }, deckId: string) => {
    console.log('Adding card to deck:', card, 'Deck ID:', deckId);
    handleNextCard();
  };

  const handleNextCard = () => {
    if (currentCardIndex < generatedCards.length - 1) {
      setCurrentCardIndex((prevIndex) => prevIndex + 1);
    } else {
      setShowModal(false);
    }
  };

  const handlePreviousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prevIndex) => prevIndex - 1);
    }
  };

  const flashcardContent = (
    <>
      <div className="flex justify-between items-center p-4 bg-white shadow-sm">
        <button onClick={onClose} className="p-2 text-gray-600 hover:text-gray-800 focus:outline-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-sm text-gray-500 text-center">{renderDeckInfo(card.decks)}</div>
        <div className="w-6"></div>
      </div>

      <div className="w-full p-6 bg-white mb-4 shadow-sm">
        <div className="text-2xl mb-4 font-semibold flex justify-center">
          <div className="markdown-content text-left">
            <ReactMarkdown>{card.front}</ReactMarkdown>
          </div>
        </div>
        {isRevealed && (
          <div className="mt-4 pt-2 border-t border-gray-200 w-full">
            <div className="text-xl flex justify-center">
              <div className="markdown-content text-left">
                <ReactMarkdown>{card.back}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-full w-full min-w-[800px] max-w-3xl mx-auto">
      <BaseChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        onGenerateFlashcards={handleGenerateFlashcards}
        inputValue={inputValue}
        setInputValue={setInputValue}
        flashcardContent={flashcardContent}
      />

      {showModal && (
        <FlashcardReviewModal
          cards={generatedCards}
          currentIndex={currentCardIndex}
          onClose={() => setShowModal(false)}
          onAddToDeck={handleAddToDeck}
          onNext={handleNextCard}
          onPrevious={handlePreviousCard}
        />
      )}
    </div>
  );
};

export default CardChatInterface;
