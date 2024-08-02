// src/components/Sidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDecksDueCounts } from '../hooks/useDecksDueCounts';
import { useDecks } from '../hooks/useDecks';
import CreateDeckModal from './modals/CreateDeckModal';
import { useKeyboardShortcuts } from '../contexts/KeyboardShortcutContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCreateDeckModalOpen, setCreateDeckModalOpen } = useKeyboardShortcuts();

  const [isReviewExpanded, setIsReviewExpanded] = useState(true);
  const [isCardsExpanded, setIsCardsExpanded] = useState(true);

  const { data: decksDueCounts, isLoading: isLoadingDueCounts, error: dueCountsError } = useDecksDueCounts();
  const { data: allDecks, isLoading: isLoadingDecks, error: decksError } = useDecks();

  const isActive = (path: string) => location.pathname === path;

  const totalDueCards = decksDueCounts?.reduce((sum, deck) => sum + deck.dueCount, 0) || 0;

  const handleReviewClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('svg')) {
      e.preventDefault();
      setIsReviewExpanded(!isReviewExpanded);
    } else {
      navigate('/review');
    }
  };

  const handleCardsClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('svg')) {
      e.preventDefault();
      setIsCardsExpanded(!isCardsExpanded);
    } else {
      navigate('/cards');
    }
  };

  const handleOpenCreateDeckModal = () => {
    setCreateDeckModalOpen(true);
  };

  const handleCloseCreateDeckModal = () => {
    setCreateDeckModalOpen(false);
  };

  return (
    <>
      <nav className="fixed top-16 left-0 bg-gray-50 h-[calc(100vh-4rem)] w-64 overflow-y-auto">
        <ul className="mb-3">
          <li>
            <Link
              to="/"
              className={`block py-3 px-6 ${isActive('/') ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/review"
              onClick={handleReviewClick}
              className={`py-3 px-6 flex justify-between items-center ${
                isActive('/review') ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'
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
                  className={`w-4 h-4 transform transition-transform ${isReviewExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </Link>
            {isReviewExpanded && (
              <ul className="ml-6">
                {isLoadingDueCounts ? (
                  <li className="py-2 px-4 text-gray-500">Loading decks...</li>
                ) : dueCountsError ? (
                  <li className="py-2 px-4 text-red-500">Error loading decks</li>
                ) : (
                  decksDueCounts?.map((deck) => (
                    <li key={deck.id}>
                      <Link
                        to={`/review/${deck.id}`}
                        className={`py-2 px-4 flex justify-between items-center ${
                          isActive(`/review/${deck.id}`) ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'
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
              onClick={handleCardsClick}
              className={`py-3 px-6 flex justify-between items-center ${
                isActive('/cards') ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'
              }`}
            >
              <span>Cards</span>
              <svg
                className={`w-4 h-4 transform transition-transform ${isCardsExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Link>
            {isCardsExpanded && (
              <ul className="ml-6">
                <li>
                  <button
                    onClick={handleOpenCreateDeckModal}
                    className="w-full text-left px-4 py-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                  >
                    + New Deck
                  </button>
                </li>
                {isLoadingDecks ? (
                  <li className="py-2 px-4 text-gray-500">Loading decks...</li>
                ) : decksError ? (
                  <li className="py-2 px-4 text-red-500">Error loading decks</li>
                ) : (
                  allDecks?.map((deck) => (
                    <li key={deck.id}>
                      <Link
                        to={`/cards/${deck.id}`}
                        className={`py-2 px-4 flex justify-between items-center ${
                          isActive(`/cards/${deck.id}`) ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'
                        }`}
                      >
                        <span>{deck.name}</span>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            )}
          </li>
        </ul>
      </nav>
      <CreateDeckModal isOpen={isCreateDeckModalOpen} onClose={handleCloseCreateDeckModal} />
    </>
  );
};

export default Sidebar;
