import React from 'react';

const PublicHome: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <h1 className="text-4xl font-bold mb-6 text-center">Welcome to Deepcards</h1>
      <p className="text-xl mb-8 text-center max-w-2xl">
        Enhance your learning with our powerful spaced repetition flashcard system. Create, organize, and review your
        cards to maximize retention and efficiency.
      </p>
      <div className="space-x-4">
        <button
          disabled={true}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default PublicHome;
