import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import BaseChatInterface from '../components/chat/BaseChatInterface';
import { useChatInfo } from '../hooks/queries/useChatInfo';
import { useExistingChat } from '../hooks/mutations/useExistingChat';
import { useCreateChat } from '../hooks/mutations/useCreateChat';
import { createTimeline } from '../utils/utils';
import MarkdownRenderer from '../components/common/MarkdownRenderer';
import { useCard } from '../hooks/queries/useCard';

const Chat: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const [searchParams] = useSearchParams();
  const cardId = searchParams.get('card_id');
  const navigate = useNavigate();

  const chatInfo = useChatInfo(chatId);

  const cardInfo = useCard(cardId || undefined);
  const existingChatMutation = useExistingChat();
  const createChatMutation = useCreateChat();

  const handleSendMessage = async (message: string) => {
    try {
      if (chatId) {
        await existingChatMutation.mutateAsync({ chatId, message });
      } else {
        const result = await createChatMutation.mutateAsync({
          message,
          cardId: cardId || undefined,
        });
        navigate(`/chat/${result.chatId}`, { replace: true });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  if (chatInfo.isLoading || cardInfo.isLoading) {
    return <LoadingState />;
  }

  if (chatInfo.error || cardInfo.error) {
    return <ErrorState />;
  }

  const flashcardContent = (cardInfo.data || chatInfo.data?.card) && (
    <FlashcardContent card={cardInfo.data || chatInfo.data?.card} />
  );

  const timeline = chatInfo.data ? createTimeline(chatInfo.data.messages, chatInfo.data.suggestions) : [];

  const sendError = existingChatMutation.error || createChatMutation.error;

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto pt-4 px-2 sm:px-4">
      {sendError && <ErrorMessage message="Failed to send message. Please try again." />}

      <BaseChatInterface
        chatId={chatId}
        timeline={timeline}
        onSendMessage={handleSendMessage}
        isAiResponding={existingChatMutation.isPending || createChatMutation.isPending}
        flashcardContent={flashcardContent}
      />
    </div>
  );
};

const LoadingState: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-xl font-semibold">Loading...</div>
  </div>
);

const ErrorState: React.FC = () => (
  <div className="flex items-center justify-center h-full">
    <div className="text-xl font-semibold text-red-600">Error loading data</div>
  </div>
);

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
    <span className="block sm:inline">{message}</span>
  </div>
);

const FlashcardContent: React.FC<{ card: any }> = ({ card }) => (
  <div className="w-full p-3 sm:p-6 bg-white mb-4 border border-gray-200 rounded-lg">
    <div className="text-base sm:text-lg mb-3 sm:mb-4 font-semibold">
      <MarkdownRenderer content={card?.front || ''} className="text-left" />
    </div>
    <div className="mt-3 sm:mt-4 pt-2 border-t border-gray-200 w-full">
      <div className="text-sm sm:text-base">
        <MarkdownRenderer content={card?.back || ''} className="text-left" />
      </div>
    </div>
  </div>
);

export default Chat;
