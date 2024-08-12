import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface CardPreviewProps {
  front: string;
  back: string;
}

const CardPreview: React.FC<CardPreviewProps> = ({ front, back }) => {
  return (
    <div className="border border-gray-300 rounded-md p-4 h-full flex flex-col">
      <div className="flex-1 flex flex-col justify-center overflow-auto">
        <div className="mb-4 pb-4 border-b flex justify-center">
          <MarkdownRenderer content={front || 'Front content preview'} className="text-left w-full" />
        </div>
        <div className="flex justify-center">
          <MarkdownRenderer content={back || 'Back content preview'} className="text-left w-full" />
        </div>
      </div>
    </div>
  );
};

export default CardPreview;
