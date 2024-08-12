import React, { useRef, useEffect, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import '../styles/markdown.css';
import { useGenerateFlashcards } from '../hooks/mutations/useGenerateFlashcards';
import { useDeleteSuggestions } from '../hooks/mutations/useDeleteSuggestions';
import { TimelineItem, Suggestion } from '../types';
import TimelineSuggestionCard from './TimelineSuggestionCard';
import PendingSuggestionCard from './PendingSuggestionCard';
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
              className={`inline-block max-w-[85%] sm:max-w-[80%] p-2 sm:p-3 rounded-lg text-left text-sm sm:text-base ${
                item.role === 'user' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
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
      <div className="flex-grow overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-4">
          {flashcardContent}
          {timeline.map(renderTimelineItem)}
          {isAiResponding && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-100 rounded-lg p-2 sm:p-3">
                <div className="animate-pulse text-sm sm:text-base">Responding...</div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-2 sm:p-4 bg-white border-t border-gray-200">
        {pendingSuggestions.length > 0 ? (
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-900 text-sm sm:text-base">Review Suggested Flashcard</h3>
              <div className="flex items-center">
                <div className="mr-2 sm:mr-4 flex">
                  {pendingSuggestions.map((_, index) => (
                    <span
                      key={index}
                      className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mx-0.5 sm:mx-1 ${
                        index === currentSuggestionIndex ? 'bg-gray-900' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={handleDismissAllSuggestions}
                  className="text-gray-500 hover:text-gray-700 text-sm sm:text-base"
                >
                  Dismiss All
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
          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
              <TextareaAutosize
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 focus:outline-none resize-none text-sm sm:text-base"
                placeholder="Type your message..."
                minRows={1}
                maxRows={5}
                disabled={isGeneratingFlashcards}
              />
              <div className="flex items-center justify-end gap-2 sm:gap-3 p-2 bg-gray-50 border-t border-gray-200">
                <button
                  type="submit"
                  className="p-1.5 sm:p-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  disabled={isGeneratingFlashcards}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleGenerateFlashcards}
                  disabled={isGeneratingFlashcards}
                  className="px-2 sm:px-3 py-1 bg-gray-200 text-gray-700 rounded text-xs sm:text-sm hover:bg-gray-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {isGeneratingFlashcards ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BaseChatInterface;
