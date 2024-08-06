// src/components/ChatInterface.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { useMessages } from '../hooks/useMessages';
// import { useChat } from '../hooks/mutations/useChat';
import BaseChatInterface from '../components/BaseChatInterface';
import { useChatInfo } from '../hooks/useChatInfo';
import { useExistingChat } from '../hooks/mutations/useExistingChat';
import { useCreateChat } from '../hooks/mutations/useCreateChat';

const topics = [
  'The history and evolution of golf clubs',
  "The impact of code-breaking on World War II's outcome",
  'Understanding quantum entanglement in physics',
  'The pros and cons of universal basic income',
  'The ethical implications of AI in healthcare',
  'Innovative technologies for carbon capture',
  'The potential for human colonization of Mars',
  'The science behind intermittent fasting',
  'The influence of Shakespeare on modern storytelling',
  'The changes in goals per game in the NHL over the years',
];

const ChatInterface: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();

  const { data: messages = [], isLoading, error } = useMessages(chatId);
  const { data: chatInfo } = useChatInfo(chatId);
  const existingChatMutation = useExistingChat();
  const createChatMutation = useCreateChat();

  console.log('messages:', messages);
  console.log('chatInfo:', chatInfo);

  const [showModal, setShowModal] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = async (message: string) => {
    try {
      if (chatId) {
        // Existing chat
        await existingChatMutation.mutateAsync({ chatId, message });
      } else {
        // New chat
        const result = await createChatMutation.mutateAsync({
          message,
        });
        navigate(`/chat/${result.chatId}`, { replace: true });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleTopicClick = (topic: string) => {
    setInputValue(`Tell me about: ${topic}`);
  };

  if (isLoading) return <div>Loading chat...</div>;
  if (error) return <div>Error loading chat: {error.message}</div>;

  const flashcardContent = chatInfo?.card ? (
    <div className="w-full p-6 bg-white mb-4 shadow-sm">
      <div className="text-2xl mb-4 font-semibold flex justify-center">
        <div className="markdown-content text-left">
          <ReactMarkdown>{chatInfo.card.front}</ReactMarkdown>
        </div>
      </div>
      <div className="mt-4 pt-2 border-t border-gray-200 w-full">
        <div className="text-xl flex justify-center">
          <div className="markdown-content text-left">
            <ReactMarkdown>{chatInfo.card.back}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  ) : undefined;

  return (
    <div className="flex flex-col h-full w-full min-w-[800px] max-w-3xl mx-auto pt-4">
      {messages.length === 0 && !createChatMutation.isPending && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          {topics.map((topic, index) => (
            <button
              key={index}
              onClick={() => handleTopicClick(topic)}
              className="p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-left"
            >
              {topic}
            </button>
          ))}
        </div>
      )}
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

export default ChatInterface;
