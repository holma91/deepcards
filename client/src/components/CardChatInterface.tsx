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
          <MarkdownRenderer content={card.front} className="text-left" />
        </div>
        {isRevealed && (
          <div className="mt-4 pt-2 border-t border-gray-200 w-full">
            <div className="text-xl flex justify-center">
              <MarkdownRenderer content={card.back} className="text-left" />
            </div>
          </div>
        )}
      </div>
    </>
  );

  const timeline = chatInfo.data ? createTimeline(chatInfo.data.messages, chatInfo.data.suggestions) : [];

  const sendError = existingChatMutation.error || createChatMutation.error;

  return (
    <div className="flex flex-col h-full w-full min-w-[800px] max-w-3xl mx-auto">
      {sendError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{'Failed to send message. Please try again.'}</span>
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
