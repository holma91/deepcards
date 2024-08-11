import React, { useRef, useEffect, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import '../styles/markdown.css';
import { useGenerateFlashcards } from '../hooks/mutations/useGenerateFlashcards';
import { TimelineItem, Suggestion } from '../types';
import TimelineSuggestionCard from './TimelineSuggestionCard';
import PendingSuggestionCard from './PendingSuggestionCard';
import { useDeleteSuggestions } from '../hooks/mutations/useDeleteSuggestions';
import MarkdownRenderer from './MarkdownRenderer';

interface BaseChatInterfaceProps {
  chatId?: string;
  timeline: TimelineItem[];
  onSendMessage: (message: string) => void;
  inputValue: string;
  setInputValue: (value: string) => void;
  isAiResponding: boolean;
  flashcardContent?: React.ReactNode;
}

const BaseChatInterface: React.FC<BaseChatInterfaceProps> = ({
  chatId,
  timeline,
  onSendMessage,
  inputValue,
  setInputValue,
  isAiResponding,
  flashcardContent,
}) => {
  const [pendingSuggestions, setPendingSuggestions] = useState<Suggestion[]>([]);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const generateFlashcardsMutation = useGenerateFlashcards();
  const deleteSuggestionsMutation = useDeleteSuggestions();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [timeline]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputValue]);

  useEffect(() => {
    const newPendingSuggestions = timeline
      .filter((item) => item.type === 'suggestion' && item.status === 'pending')
      .map((item) => item as Suggestion)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setPendingSuggestions(newPendingSuggestions);
    setCurrentSuggestionIndex(0);
  }, [timeline]);

  const handleGenerateFlashcards = async () => {
    if (!chatId) {
      console.error('No chat ID available');
      return;
    }

    try {
      const result = await generateFlashcardsMutation.mutateAsync({ chatId });
      setPendingSuggestions(result.suggestions);
      setCurrentSuggestionIndex(0);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      // TODO: Show error message to the user
    }
  };

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

  const handleDismissAllSuggestions = () => {
    if (!chatId) return;

    const pendingSuggestionIds = pendingSuggestions.map((s) => s.id);

    deleteSuggestionsMutation.mutate(
      {
        suggestionIds: pendingSuggestionIds,
        chatId,
      },
      {
        onSuccess: () => {
          setPendingSuggestions([]);
          setCurrentSuggestionIndex(0);
        },
        onError: (error) => {
          console.error('Failed to delete suggestions:', error);
          // Optionally, show an error message to the user
        },
      }
    );
  };

  const isGeneratingFlashcards = generateFlashcardsMutation.isPending;

  const renderTimelineItem = (item: TimelineItem, index: number) => {
    if (item.type === 'message') {
      return (
        <div key={index} className={`mb-4 ${item.role === 'user' ? 'text-right' : 'text-left'}`}>
          <div>
            <MarkdownRenderer
              content={item.content}
              className={`inline-block max-w-[80%] p-3 rounded-lg text-left ${
                item.role === 'user' ? 'bg-black text-white' : 'bg-gray-100'
              }`}
            />
          </div>
        </div>
      );
    } else if (item.type === 'suggestion' && item.status !== 'pending') {
      return <TimelineSuggestionCard key={index} suggestion={item} />;
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto pr-4">
        <div className="max-w-3xl mx-auto">
          {flashcardContent}
          {timeline.map(renderTimelineItem)}
          {isAiResponding && (
            <div className="flex justify-center mb-4">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="animate-pulse">Responding...</div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 bg-white shadow-sm">
        {pendingSuggestions.length > 0 ? (
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Review Suggested Flashcard</h3>
              <div className="flex items-center">
                <div className="mr-4">
                  {pendingSuggestions.map((_, index) => (
                    <span
                      key={index}
                      className={`inline-block w-2 h-2 rounded-full mx-1 ${
                        index === currentSuggestionIndex ? 'bg-black' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <button onClick={handleDismissAllSuggestions} className="text-gray-500 hover:text-gray-700">
                  Dismiss All (×)
                </button>
              </div>
            </div>
            <PendingSuggestionCard
              suggestion={pendingSuggestions[currentSuggestionIndex]}
              chatId={chatId || ''}
              onNextSuggestion={() => {
                if (currentSuggestionIndex < pendingSuggestions.length - 1) {
                  setCurrentSuggestionIndex(currentSuggestionIndex + 1);
                } else {
                  setPendingSuggestions([]);
                  setCurrentSuggestionIndex(0);
                }
              }}
            />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex items-end max-w-3xl mx-auto">
            <TextareaAutosize
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-grow px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none"
              placeholder="Type your message..."
              minRows={1}
              maxRows={5}
              disabled={isGeneratingFlashcards}
            />
            <button
              type="submit"
              className="ml-2 p-2 bg-black text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isGeneratingFlashcards}
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
              onClick={handleGenerateFlashcards}
              disabled={isGeneratingFlashcards}
              className="ml-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingFlashcards ? 'Generating...' : 'Generate Flashcards'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default BaseChatInterface;
