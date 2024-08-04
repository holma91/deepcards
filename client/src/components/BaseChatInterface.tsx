// src/components/BaseChatInterface.tsx
import React, { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import TextareaAutosize from 'react-textarea-autosize';
import { Message } from '../types';
import '../markdown.css';

interface BaseChatInterfaceProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onGenerateFlashcards: () => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  flashcardContent?: React.ReactNode;
}

const BaseChatInterface: React.FC<BaseChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onGenerateFlashcards,
  inputValue,
  setInputValue,
  flashcardContent,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto">
        {flashcardContent}
        {messages.map((message, index) => (
          <div key={index} className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
            <div
              className={`inline-block max-w-[80%] p-3 rounded-lg ${
                message.role === 'user' ? 'bg-black text-white' : 'bg-gray-100'
              }`}
            >
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white shadow-sm">
        <form onSubmit={handleSubmit} className="flex items-end">
          <TextareaAutosize
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none"
            placeholder="Type your message..."
            minRows={1}
            maxRows={5}
          />
          <button
            type="submit"
            className="ml-2 p-2 bg-black text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onGenerateFlashcards}
            className="ml-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Generate Flashcards
          </button>
        </form>
      </div>
    </div>
  );
};

export default BaseChatInterface;
