import React, { useState } from 'react';
import LoginModal from '../components/LoginModal';

const PublicHome: React.FC = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">
      <h1 className="text-4xl font-bold mb-6 text-center">
        Welcome to Deepcards
      </h1>
      <p className="text-xl mb-8 text-center max-w-2xl">
        Enhance your learning with our powerful spaced repetition flashcard
        system. Create, organize, and review your cards to maximize retention
        and efficiency.
      </p>
      <div className="space-x-4">
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300"
        >
          Get Started
        </button>
        <a
          href="#features"
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-300"
        >
          Learn More
        </a>
      </div>
      <div id="features" className="mt-16 w-full max-w-4xl">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard
            title="Spaced Repetition"
            description="Optimize your learning with our scientifically-proven spaced repetition algorithm."
          />
          <FeatureCard
            title="Flexible Organization"
            description="Create and manage multiple decks to organize your cards effectively."
          />
          <FeatureCard
            title="Progress Tracking"
            description="Monitor your learning progress with detailed statistics and insights."
          />
        </div>
      </div>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        isGetStarted={true}
      />
    </div>
  );
};

const FeatureCard: React.FC<{ title: string; description: string }> = ({
  title,
  description,
}) => {
  return (
    <div className="bg-gray-100 p-6 rounded-lg">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default PublicHome;
