import React, { forwardRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

interface MarkdownTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  className?: string;
}

const MarkdownTextarea = forwardRef<HTMLTextAreaElement, MarkdownTextareaProps>(
  ({ value, onChange, placeholder, onKeyDown, className = '' }, ref) => {
    return (
      <TextareaAutosize
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={`w-full p-3 font-mono text-base resize-none border border-gray-200 rounded-md 
                    focus:ring-2 focus:ring-gray-500 focus:border-transparent 
                    placeholder-gray-400 transition-all duration-200 ease-in-out
                    ${className}`}
        minRows={3}
        style={{
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
          transition: 'border-color 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        }}
      />
    );
  }
);

export default MarkdownTextarea;
