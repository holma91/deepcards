// src/components/ChatInterface.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessages } from '../hooks/useMessages';
import { useChat } from '../hooks/mutations/useChat';
import { Message } from '../types';
import BaseChatInterface from './BaseChatInterface';

const ChatInterface: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();
  const { data: messages = [], isLoading, error } = useMessages(chatId);
  const chatMutation = useChat();

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
      // The error handling is now managed by React Query
    }
  };

  if (isLoading) return <div>Loading chat...</div>;
  if (error) return <div>Error loading chat: {error.message}</div>;

  return (
    <div className="flex flex-col h-full w-full min-w-[800px] max-w-3xl mx-auto pt-4">
      <BaseChatInterface
        messages={messages.length > 0 ? messages : [{ role: 'assistant', content: 'How can I assist you today?' }]}
        onSendMessage={handleSendMessage}
        onGenerateFlashcards={() => {
          console.log('Generate flashcards');
        }}
      />
    </div>
  );
};

export default ChatInterface;
