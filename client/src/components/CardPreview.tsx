import React from 'react';
import ReactMarkdown from 'react-markdown';

interface CardPreviewProps {
  front: string;
  back: string;
}

const CardPreview: React.FC<CardPreviewProps> = ({ front, back }) => {
  return (
    <div className="border border-gray-300 rounded-md p-4 h-full flex flex-col">
      <div className="flex-1 flex flex-col justify-center overflow-auto">
        <div className="mb-4 pb-4 border-b flex justify-center">
          <div className="markdown-content text-left">
            <ReactMarkdown>{front || 'Front content preview'}</ReactMarkdown>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="markdown-content text-left">
            <ReactMarkdown>{back || 'Back content preview'}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardPreview;
