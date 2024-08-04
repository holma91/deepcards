// src/components/ChatInterface.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessages } from '../hooks/useMessages';
import { useChat } from '../hooks/mutations/useChat';
import { Message } from '../types';
import BaseChatInterface from '../components/BaseChatInterface';

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
  'The future of decentralized finance and cryptocurrency',
];

const ChatInterface: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();
  const { data: messages = [], isLoading, error } = useMessages(chatId);
  const chatMutation = useChat();
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = async (message: string) => {
    const userMessage: Message = { role: 'user', content: message };
    const newMessages = [...messages, userMessage];

    try {
      const result = await chatMutation.mutateAsync({
        chatId,
        messages: newMessages,
      });

      // If it's a new chat, update the URL
      if (!chatId) {
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

  return (
    <div className="flex flex-col h-full w-full min-w-[800px] max-w-3xl mx-auto pt-4">
      {messages.length === 0 && (
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
        messages={messages}
        onSendMessage={handleSendMessage}
        onGenerateFlashcards={() => {
          console.log('Generate flashcards');
        }}
        inputValue={inputValue}
        setInputValue={setInputValue}
      />
    </div>
  );
};

export default ChatInterface;
