import React from 'react';
import { Link } from 'react-router-dom';

const Feature: React.FC<{ title: string; description: string; icon: React.ReactNode }> = ({
  title,
  description,
  icon,
}) => (
  <div className="flex flex-col items-center text-center">
    <div className="mb-4 text-gray-800">{icon}</div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const PublicHome: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4 py-16">
      <div className="max-w-4xl w-full">
        <h1 className="text-5xl font-bold mb-6 text-center text-gray-900">Deepcards</h1>
        <p className="text-xl mb-12 text-center text-gray-600 max-w-2xl mx-auto">
          Enhance your learning through AI-powered flashcards and intelligent spaced repetition.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          <Feature
            title="Manual Creation"
            description="Craft your own flashcards with our intuitive interface."
            icon={
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            }
          />
          <Feature
            title="AI Generation"
            description="Automatically create flashcards from your conversations."
            icon={
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            }
          />
          <Feature
            title="Memory Enhancement"
            description="Optimize your learning with intelligent spaced repetition."
            icon={
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            }
          />
        </div>

        <div className="flex justify-center space-x-4">
          <Link
            to="/signup"
            className="px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Get Started
          </Link>
          <Link
            to="/signin"
            className="px-6 py-3 bg-white text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PublicHome;
