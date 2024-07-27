// src/components/Sidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDecksDueCounts } from '../hooks/useDecksDueCounts';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isReviewExpanded, setIsReviewExpanded] = useState(false);
  const { data: decksDueCounts, isLoading, error } = useDecksDueCounts();

  const isActive = (path: string) => location.pathname === path;

  // Calculate total due cards
  const totalDueCards =
    decksDueCounts?.reduce((sum, deck) => sum + deck.dueCount, 0) || 0;

  const handleReviewClick = (e: React.MouseEvent) => {
    // If clicking on the chevron, just toggle expansion
    if ((e.target as HTMLElement).closest('svg')) {
      e.preventDefault();
      setIsReviewExpanded(!isReviewExpanded);
    } else {
      // If clicking elsewhere, navigate and expand
      navigate('/review');
      setIsReviewExpanded(true);
    }
  };

  const handleOtherClick = () => {
    setIsReviewExpanded(false);
  };

  return (
    <nav className="fixed top-16 left-0 bg-gray-50 h-[calc(100vh-4rem)] w-64 overflow-y-auto">
      <ul className="mt-6">
        <li>
          <Link
            to="/"
            className={`block py-3 px-6 ${
              isActive('/') ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'
            }`}
            onClick={handleOtherClick}
          >
            Dashboard
          </Link>
        </li>
        <li>
          <Link
            to="/review"
            onClick={handleReviewClick}
            className={`py-3 px-6 flex justify-between items-center ${
              isActive('/review')
                ? 'bg-gray-200 font-semibold'
                : 'hover:bg-gray-100'
            }`}
          >
            <span>Review</span>
            <div className="flex items-center">
              {totalDueCards > 0 && (
                <span className="bg-black text-white text-xs font-bold px-2 py-1 rounded-full mr-2">
                  {totalDueCards}
                </span>
              )}
              <svg
                className={`w-4 h-4 transform transition-transform ${
                  isReviewExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </Link>
          {isReviewExpanded && (
            <ul className="ml-6">
              {isLoading ? (
                <li className="py-2 px-4 text-gray-500">Loading decks...</li>
              ) : error ? (
                <li className="py-2 px-4 text-red-500">Error loading decks</li>
              ) : (
                decksDueCounts?.map((deck) => (
                  <li key={deck.id}>
                    <Link
                      to={`/review/${deck.id}`}
                      className={`py-2 px-4 flex justify-between items-center ${
                        isActive(`/review/${deck.id}`)
                          ? 'bg-gray-200 font-semibold'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <span>{deck.name}</span>
                      {deck.dueCount > 0 && (
                        <span className="bg-black text-white text-xs font-bold px-2 py-1 rounded-full">
                          {deck.dueCount}
                        </span>
                      )}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          )}
        </li>
        <li>
          <Link
            to="/cards"
            className={`block py-3 px-6 ${
              isActive('/cards')
                ? 'bg-gray-200 font-semibold'
                : 'hover:bg-gray-100'
            }`}
            onClick={handleOtherClick}
          >
            Cards
          </Link>
        </li>
      </ul>
    </nav>
  );
};

export default Sidebar;
