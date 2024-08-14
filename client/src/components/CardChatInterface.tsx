import React, { useEffect, useState } from 'react';
import BaseChatInterface from './BaseChatInterface';
import renderDeckInfo from '../utils/renderDeckInfo';
import { useChatInfo } from '../hooks/useChatInfo';
import { useExistingChat } from '../hooks/mutations/useExistingChat';
import { useCreateChat } from '../hooks/mutations/useCreateChat';
import { CardWithDecks } from '../types';
import { useQueryClient } from '@tanstack/react-query';
import { createTimeline } from '../utils/utils';
import MarkdownRenderer from './MarkdownRenderer';

interface CardChatInterfaceProps {
  card: CardWithDecks;
  isRevealed: boolean;
  onClose: () => void;
}

const CardChatInterface: React.FC<CardChatInterfaceProps> = ({ card, isRevealed, onClose }) => {
  const [chatId, setChatId] = useState<string | undefined>(card.chat_id || undefined);
  const [inputValue, setInputValue] = useState('');

  const chatInfo = useChatInfo(chatId);
  const existingChatMutation = useExistingChat();
  const createChatMutation = useCreateChat();
  const queryClient = useQueryClient();

  useEffect(() => {
    setChatId(card.chat_id || undefined);
  }, [card.chat_id]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSendMessage = async (message: string) => {
    try {
      if (card.chat_id) {
        await existingChatMutation.mutateAsync({ chatId: card.chat_id, message });
      } else {
        const { chatId: newChatId } = await createChatMutation.mutateAsync({
          message,
          cardId: card.id,
        });
        setChatId(newChatId);

        queryClient.setQueryData(['cards', 'due'], (oldCards: CardWithDecks[] | undefined) => {
          if (!oldCards) return oldCards;

          return oldCards.map((oldCard) => {
            if (oldCard.id === card.id) {
              return { ...oldCard, chat_id: newChatId };
            }
            return oldCard;
          });
        });
        queryClient.setQueryData(['cards', 'due', card.decks[0].id], (oldCards: CardWithDecks[] | undefined) => {
          if (!oldCards) return oldCards;

          return oldCards.map((oldCard) => {
            if (oldCard.id === card.id) {
              return { ...oldCard, chat_id: newChatId };
            }
            return oldCard;
          });
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const flashcardContent = (
    <div className="max-w-full mx-auto space-y-2 sm:space-y-4 px-2 sm:px-0  sm:max-w-3xl sm:min-w-[32rem]">
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex justify-between items-center p-2 sm:p-4 border-b border-gray-200">
          <button
            onClick={onClose}
            className="p-1 sm:p-2 rounded-md hover:bg-gray-100 transition-colors duration-200 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-xs sm:text-sm text-gray-600 font-medium">{renderDeckInfo(card.decks)}</div>
          <div className="w-5 sm:w-8"></div> {/* Placeholder for balance */}
        </div>

        <div className="p-3 sm:p-6">
          <div className="text-lg sm:text-xl font-semibold mb-2 sm:mb-4">
            <MarkdownRenderer content={card.front} className="text-left" />
          </div>
          {isRevealed && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
              <div className="text-base sm:text-lg">
                <MarkdownRenderer content={card.back} className="text-left" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const timeline = chatInfo.data ? createTimeline(chatInfo.data.messages, chatInfo.data.suggestions) : [];

  const sendError = existingChatMutation.error || createChatMutation.error;

  return (
    <div className="flex flex-col h-full w-full max-w-full sm:max-w-3xl mx-auto px-2 sm:px-0">
      {sendError && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded relative mb-2 sm:mb-4 text-sm sm:text-base"
          role="alert"
        >
          <span className="block sm:inline">Failed to send message. Please try again.</span>
        </div>
      )}
      <BaseChatInterface
        chatId={card.chat_id || undefined}
        timeline={timeline}
        onSendMessage={handleSendMessage}
        inputValue={inputValue}
        setInputValue={setInputValue}
        isAiResponding={existingChatMutation.isPending || createChatMutation.isPending}
        flashcardContent={flashcardContent}
      />
    </div>
  );
};

export default CardChatInterface;
