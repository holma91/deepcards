import React, { useState, useEffect } from 'react';
import BaseChatInterface from './BaseChatInterface';
import { Card } from '../types';
import ReactMarkdown from 'react-markdown';
import renderDeckInfo from '../utils/renderDeckInfo';
import { useMessages } from '../hooks/useMessages';
import { useExistingChat } from '../hooks/mutations/useExistingChat';
import { useCreateChat } from '../hooks/mutations/useCreateChat';

interface CardChatInterfaceProps {
  card: Card;
  isRevealed: boolean;
  onClose: () => void;
}

const CardChatInterface: React.FC<CardChatInterfaceProps> = ({ card, isRevealed, onClose }) => {
  const [chatId, setChatId] = useState<string | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const { data: messages = [], isLoading, error } = useMessages(chatId);
  const existingChatMutation = useExistingChat();
  const createChatMutation = useCreateChat();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !showModal) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showModal]);

  const handleSendMessage = async (message: string) => {
    try {
      if (chatId) {
        // Existing chat
        await existingChatMutation.mutateAsync({ chatId, message });
      } else {
        // New chat
        const result = await createChatMutation.mutateAsync({
          message,
          cardId: card.id, // Always provide cardId for new chats in this context
        });
        setChatId(result.chatId);
      }
    } catch (error) {
      console.error('Error:', error);
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

  if (isLoading) return <div>Loading chat...</div>;
  if (error) return <div>Error loading chat: {error.message}</div>;

  return (
    <div className="flex flex-col h-full w-full min-w-[800px] max-w-3xl mx-auto">
      <BaseChatInterface
        chatId={chatId}
        messages={messages}
        onSendMessage={handleSendMessage}
        inputValue={inputValue}
        setInputValue={setInputValue}
        setShowModal={setShowModal}
        showModal={showModal}
        disableGenerateFlashcards={messages.length === 0}
        isAiResponding={existingChatMutation.isPending || createChatMutation.isPending}
        flashcardContent={flashcardContent}
      />
    </div>
  );
};

export default CardChatInterface;
