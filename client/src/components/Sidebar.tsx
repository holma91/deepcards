// src/components/Sidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDecksDueCounts } from '../hooks/useDecksDueCounts';
import { useDecks } from '../hooks/useDecks';
import { useCreateDeck } from '../hooks/mutations/useCreateDeck';
import { v4 as uuidv4 } from 'uuid';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isReviewExpanded, setIsReviewExpanded] = useState(true);
  const [isCardsExpanded, setIsCardsExpanded] = useState(true);
  const [newDeckName, setNewDeckName] = useState('');
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const {
    data: decksDueCounts,
    isLoading: isLoadingDueCounts,
    error: dueCountsError,
  } = useDecksDueCounts();
  const {
    data: allDecks,
    isLoading: isLoadingDecks,
    error: decksError,
  } = useDecks();
  const createDeckMutation = useCreateDeck();

  const isActive = (path: string) => location.pathname === path;

  const totalDueCards =
    decksDueCounts?.reduce((sum, deck) => sum + deck.dueCount, 0) || 0;

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

  const handleCreateDeck = () => {
    if (newDeckName.trim()) {
      const newDeckId = uuidv4();
      createDeckMutation.mutate(
        { id: newDeckId, name: newDeckName.trim() },
        {
          onSuccess: () => {
            setNewDeckName('');
            setIsCreatingDeck(false);
          },
        }
      );
    }
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
            onClick={handleCardsClick}
            className={`py-3 px-6 flex justify-between items-center ${
              isActive('/cards')
                ? 'bg-gray-200 font-semibold'
                : 'hover:bg-gray-100'
            }`}
          >
            <span>Cards</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${
                isCardsExpanded ? 'rotate-180' : ''
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
          </Link>
          {isCardsExpanded && (
            <ul className="ml-6">
              <li>
                {isCreatingDeck ? (
                  <div className="px-4 py-2 space-y-2">
                    <input
                      type="text"
                      value={newDeckName}
                      onChange={(e) => setNewDeckName(e.target.value)}
                      placeholder="New deck name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCreateDeck}
                        className="flex-1 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        disabled={createDeckMutation.isPending}
                      >
                        {createDeckMutation.isPending
                          ? 'Creating...'
                          : 'Create'}
                      </button>
                      <button
                        onClick={() => setIsCreatingDeck(false)}
                        className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreatingDeck(true)}
                    className="w-full text-left px-4 py-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                  >
                    + New Deck
                  </button>
                )}
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
                        isActive(`/cards/${deck.id}`)
                          ? 'bg-gray-200 font-semibold'
                          : 'hover:bg-gray-100'
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
  );
};

export default Sidebar;
