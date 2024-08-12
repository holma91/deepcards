import React, { useState } from 'react';
import { Suggestion } from '../types';
import MarkdownRenderer from './MarkdownRenderer';

interface TimelineSuggestionCardProps {
  suggestion: Suggestion;
}

const TimelineSuggestionCard: React.FC<TimelineSuggestionCardProps> = ({ suggestion }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Return null if the suggestion is rejected
  if (suggestion.status !== 'accepted') {
    return null;
  }

  return (
    <div className="w-full my-2 sm:my-4">
      <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between"
        >
          <span className="font-medium text-gray-900 text-sm sm:text-base">Accepted Flashcard</span>
          <svg
            className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {isExpanded && (
          <div className="p-3 sm:p-4 bg-white">
            <div className="mb-3 sm:mb-4">
              <strong className="text-sm sm:text-base text-gray-700">Front:</strong>
              <div className="mt-1 text-sm sm:text-base">
                <MarkdownRenderer content={suggestion.front} />
              </div>
            </div>
            <div>
              <strong className="text-sm sm:text-base text-gray-700">Back:</strong>
              <div className="mt-1 text-sm sm:text-base">
                <MarkdownRenderer content={suggestion.back} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineSuggestionCard;
