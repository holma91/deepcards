import React, { forwardRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

interface MarkdownTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const MarkdownTextarea = forwardRef<HTMLTextAreaElement, MarkdownTextareaProps>(
  ({ value, onChange, placeholder, onKeyDown }, ref) => {
    return (
      <TextareaAutosize
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="w-full p-2 font-mono resize-none border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black"
        minRows={3}
      />
    );
  }
);

export default MarkdownTextarea;
