import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';

interface MarkdownTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const MarkdownTextarea: React.FC<MarkdownTextareaProps> = ({ value, onChange, placeholder }) => {
  return (
    <TextareaAutosize
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full p-2 font-mono resize-none border border-gray-300 rounded-md shadow-sm focus:ring-black focus:border-black"
      minRows={3}
    />
  );
};

export default MarkdownTextarea;
