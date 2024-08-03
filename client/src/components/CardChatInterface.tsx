import React, { useEffect } from 'react';
import BaseChatInterface from './BaseChatInterface';
import { Card, Message } from '../types';
import { useChat } from '../hooks/mutations/useChat';
import FlashcardReviewModal from './modals/FlashcardReviewModal';
import ReactMarkdown from 'react-markdown';
import renderDeckInfo from '../utils/renderDeckInfo';

interface CardChatInterfaceProps {
  card: Card;
  isRevealed: boolean;
  onClose: () => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

const CardChatInterface: React.FC<CardChatInterfaceProps> = ({ card, isRevealed, onClose, messages, setMessages }) => {
  const [generatedCards, setGeneratedCards] = React.useState<Array<{ front: string; back: string }>>([]);
  const [showModal, setShowModal] = React.useState(false);
  const [currentCardIndex, setCurrentCardIndex] = React.useState(0);

  const chatMutation = useChat();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !showModal) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, showModal]);

  const handleSendMessage = async (message: string) => {
    const userMessage: Message = { role: 'user', content: message };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    const cardContent = `
      Front: ${card.front}
      Back: ${card.back}
      Note: The back of the card is ${isRevealed ? 'revealed' : 'not revealed'} to the user.
    `;

    try {
      const result = await chatMutation.mutateAsync({
        cardContent: cardContent,
        messages: newMessages.slice(1),
      });

      const assistantMessage: Message = { role: 'assistant', content: result.response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleGenerateFlashcards = () => {
    const dummyCards = [
      { front: 'What is React?', back: 'A JavaScript library for building user interfaces' },
      { front: 'What is JSX?', back: 'A syntax extension for JavaScript used with React' },
      { front: 'What is a component in React?', back: 'A reusable piece of UI with its own logic and styling' },
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

  return (
    <div className="flex flex-col h-full w-full min-w-[800px] max-w-3xl mx-auto">
      <div className="sticky top-0 z-40 bg-white w-full">
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
      </div>

      <div className="flex-grow overflow-y-auto">
        <BaseChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          onGenerateFlashcards={handleGenerateFlashcards}
        />
      </div>

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
