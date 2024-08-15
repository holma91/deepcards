import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import BaseChatInterface from '../components/BaseChatInterface';
import { useChatInfo } from '../hooks/useChatInfo';
import { useExistingChat } from '../hooks/mutations/useExistingChat';
import { useCreateChat } from '../hooks/mutations/useCreateChat';
import { createTimeline } from '../utils/utils';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useCard } from '../hooks/useCard';

const topics = [
  'The history and evolution of golf clubs',
  "The impact of code-breaking on World War II's outcome",
  'Understanding quantum entanglement in physics',
  'The pros and cons of universal basic income',
  'The ethical implications of AI in healthcare',
  'Innovative technologies for carbon capture',
  // 'The potential for human colonization of Mars',
  // 'The science behind intermittent fasting',
  // 'The influence of Shakespeare on modern storytelling',
  // 'The changes in goals per game in the NHL over the years',
];

const Chat: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const [searchParams] = useSearchParams();
  const cardId = searchParams.get('card_id');
  const navigate = useNavigate();
  // const [inputValue, setInputValue] = useState('');

  const chatInfo = useChatInfo(chatId);
  const cardInfo = useCard(cardId || undefined);
  const existingChatMutation = useExistingChat();
  const createChatMutation = useCreateChat();

  // const handleTopicClick = (topic: string) => {
  //   setInputValue(`Tell me about: ${topic}`);
  // };

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

      {/* {timeline.length === 0 && !createChatMutation.isPending && !cardId && (
        <TopicSuggestions topics={topics} onTopicClick={handleTopicClick} />
      )} */}

      <BaseChatInterface
        chatId={chatId}
        timeline={timeline}
        onSendMessage={handleSendMessage}
        // inputValue={inputValue}
        // setInputValue={setInputValue}
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

const TopicSuggestions: React.FC<{ topics: string[]; onTopicClick: (topic: string) => void }> = ({
  topics,
  onTopicClick,
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-4">
    {topics.map((topic, index) => (
      <button
        key={index}
        onClick={() => onTopicClick(topic)}
        className="p-2 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left text-xs sm:text-sm"
      >
        {topic}
      </button>
    ))}
  </div>
);

export default Chat;
