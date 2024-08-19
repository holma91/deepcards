import React from 'react';
import { useNavigate } from 'react-router-dom';

const PublicHome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full bg-white px-4 py-16">
      <div className="max-w-xl w-full">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">Learn, chat, and remember</h1>
        <p className="text-lg mb-6 text-gray-600">LLM-powered learning meets traditional memory techniques.</p>

        <ul className="list-disc pl-5 mb-12 space-y-2 text-gray-600">
          <li>Every flashcard has an associated conversation</li>
          <li>Generate cards automatically from conversations</li>
          <li>Spaced repetition for optimal retention</li>
        </ul>

        <button
          onClick={() => navigate('/signup')}
          className="w-full px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default PublicHome;
