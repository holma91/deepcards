import React, { useState } from 'react';
import BaseChatInterface from './BaseChatInterface';
import { Message } from '../types';
import { useChat } from '../hooks/mutations/useChat';
import FlashcardReviewModal from './modals/FlashcardReviewModal';

const StandaloneChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'How can I assist you today?' }]);
  const [generatedCards, setGeneratedCards] = useState<Array<{ front: string; back: string }>>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const chatMutation = useChat();

  const handleSendMessage = async (message: string) => {
    const userMessage: Message = { role: 'user', content: message };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const result = await chatMutation.mutateAsync({
        messages: newMessages.slice(1),
      });

      console.log('Assistant response:', result.response);

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
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <BaseChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        onGenerateFlashcards={handleGenerateFlashcards}
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

export default StandaloneChatInterface;
