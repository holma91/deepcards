// src/components/TimelineSuggestionCard.tsx
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
    <div className="w-full my-4">
      <div className="border border-green-300 rounded-md overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full text-left px-4 py-2 bg-green-100 hover:bg-green-200 transition-colors duration-200 flex items-center justify-between"
        >
          <span className="font-medium text-green-700">Accepted Flashcard</span>
          <span className="text-gray-500">{isExpanded ? '▲ Collapse' : '▼ Expand'}</span>
        </button>
        {isExpanded && (
          <div className="p-4 bg-white">
            <div className="mb-2">
              <strong>Front:</strong>
              <MarkdownRenderer content={suggestion.front} />
            </div>
            <div className="mb-4">
              <strong>Back:</strong>
              <MarkdownRenderer content={suggestion.back} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimelineSuggestionCard;
