// src/pages/ChatPage.tsx
import React from 'react';
import StandaloneChatInterface from '../components/StandaloneChatInterface';

const ChatPage: React.FC = () => {
  return (
    <div className="h-[calc(100vh-64px)] flex items-center justify-center">
      <StandaloneChatInterface />
    </div>
  );
};

export default ChatPage;
