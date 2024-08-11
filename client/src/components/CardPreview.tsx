import React from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface CardPreviewProps {
  front: string;
  back: string;
}

const CardPreview: React.FC<CardPreviewProps> = ({ front, back }) => {
  const frontContent = front || 'Front content preview';
  const backContent = back || 'Back content preview';

  return (
    <div className="border border-gray-300 rounded-md p-4 h-full flex flex-col">
      <div className="flex-1 flex flex-col justify-center overflow-auto">
        <div className="mb-4 pb-4 border-b flex justify-center">
          <MarkdownRenderer
            content={frontContent}
            className={`w-full ${front ? 'text-left' : 'text-center text-gray-500'}`}
          />
        </div>
        <div className="flex justify-center">
          <MarkdownRenderer
            content={backContent}
            className={`w-full ${back ? 'text-left' : 'text-center text-gray-500'}`}
          />
        </div>
      </div>
    </div>
  );
};

export default CardPreview;
