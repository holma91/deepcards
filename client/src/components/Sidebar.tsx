// src/components/Sidebar.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from '@headlessui/react';
import { useDecksDueCounts } from '../hooks/useDecksDueCounts';
import { useDecks } from '../hooks/useDecks';
import CreateDeckModal from './modals/CreateDeckModal';
import DeleteChatModal from './modals/DeleteChatModal';
import { useKeyboardShortcuts } from '../contexts/KeyboardShortcutContext';
import { useChats } from '../hooks/useChats';
import { useRenameChat } from '../hooks/mutations/useRenameChat';
import { useDeleteChat } from '../hooks/mutations/useDeleteChat';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isCreateDeckModalOpen, setCreateDeckModalOpen } = useKeyboardShortcuts();

  const [isReviewExpanded, setIsReviewExpanded] = useState(false);
  const [isCardsExpanded, setIsCardsExpanded] = useState(false);
  const [isChatsExpanded, setIsChatsExpanded] = useState(false);
  const [deletingChat, setDeletingChat] = useState<{ id: string; title: string } | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatTitle, setEditingChatTitle] = useState('');
  const [showAllChats, setShowAllChats] = useState(false);
  const INITIAL_CHAT_COUNT = 5;

  const editInputRef = useRef<HTMLInputElement>(null);

  const { data: decksDueCounts, isLoading: isLoadingDueCounts, error: dueCountsError } = useDecksDueCounts();
  const { data: allDecks, isLoading: isLoadingDecks, error: decksError } = useDecks();
  const { data: allChats, isLoading: isLoadingChats, error: chatsError } = useChats();
  const renameChat = useRenameChat();
  const deleteChat = useDeleteChat();

  const isActive = (path: string) => location.pathname === path;

  const totalDueCards = decksDueCounts?.reduce((sum, deck) => sum + deck.due_count, 0) || 0;
  const visibleChats = showAllChats ? allChats : allChats?.slice(0, INITIAL_CHAT_COUNT);

  const handleReviewClick = () => {
    setIsReviewExpanded(!isReviewExpanded);
    navigate('/review');
  };

  const handleCardsClick = () => {
    setIsCardsExpanded(!isCardsExpanded);
    navigate('/cards');
  };

  const handleChatsClick = () => {
    setIsChatsExpanded(!isChatsExpanded);
    navigate('/chat');
  };

  const handleOpenCreateDeckModal = () => {
    setCreateDeckModalOpen(true);
  };

  const handleCloseCreateDeckModal = () => {
    setCreateDeckModalOpen(false);
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      await renameChat.mutateAsync({ chatId, title: newTitle });
      setEditingChatId(null);
    } catch (error) {
      console.error('Failed to rename chat:', error);
    }
  };

  const handleDeleteChat = async () => {
    if (deletingChat) {
      try {
        await deleteChat.mutateAsync(deletingChat.id);

        // Check if the deleted chat was the active one
        if (isActive(`/chat/${deletingChat.id}`)) {
          navigate('/chat');
        }

        setDeletingChat(null);
      } catch (error) {
        console.error('Failed to delete chat:', error);
      }
    }
  };

  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingChatId]);

  return (
    <>
      <nav
        className={`bg-gray-50 h-screen w-64 flex flex-col transition-all duration-300 fixed top-0 left-0 ${
          isCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className="sticky top-0 z-10 bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center">
          <button
            onClick={onToggle}
            className="p-1 rounded-full hover:bg-gray-200 focus:outline-none"
            aria-label="Collapse Sidebar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <Link to="/chat" className="p-1 rounded-full hover:bg-gray-200 focus:outline-none" aria-label="Go to Chat">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </Link>
        </div>
        <div className="flex-grow overflow-y-auto text-sm-plus">
          {!isCollapsed && (
            <ul className="mb-3">
              <li>
                <Link
                  to="/chat"
                  onClick={handleChatsClick}
                  className={`py-3 px-6 flex justify-between items-center ${
                    isActive('/chat') ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'
                  }`}
                >
                  <span>Chat</span>
                  <svg
                    className={`w-4 h-4 transform transition-transform ${isChatsExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>

                {isChatsExpanded && (
                  <ul className="ml-6">
                    {isLoadingChats ? (
                      <li className="py-2 px-4 text-gray-500">Loading chats...</li>
                    ) : chatsError ? (
                      <li className="py-2 px-4 text-red-500">Error loading chats</li>
                    ) : (
                      <>
                        {visibleChats?.map((chat) => (
                          <li
                            key={chat.id}
                            className={`flex items-center justify-between py-2 px-4 group ${
                              isActive(`/chat/${chat.id}`) ? 'bg-gray-200' : 'hover:bg-gray-100'
                            }`}
                          >
                            {editingChatId === chat.id ? (
                              <input
                                ref={editInputRef}
                                value={editingChatTitle}
                                onChange={(e) => setEditingChatTitle(e.target.value)}
                                onBlur={() => handleRenameChat(chat.id, editingChatTitle)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleRenameChat(chat.id, editingChatTitle);
                                  }
                                }}
                                className="flex-grow bg-gray-100 px-2 py-1 rounded"
                              />
                            ) : (
                              <Link
                                to={`/chat/${chat.id}`}
                                className={`flex-grow ${isActive(`/chat/${chat.id}`) ? 'font-semibold' : ''}`}
                              >
                                <span>{chat.title}</span>
                              </Link>
                            )}
                            <Menu as="div" className="relative inline-block text-left">
                              <div>
                                <MenuButton className="p-1 rounded-full hover:bg-gray-200 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity">
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                                  </svg>
                                </MenuButton>
                              </div>
                              <Transition
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                              >
                                <MenuItems className="absolute right-0 w-56 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                                  <div className="px-1 py-1">
                                    <MenuItem>
                                      {({ active }) => (
                                        <button
                                          className={`${
                                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                          } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                          onClick={() => {
                                            setEditingChatId(chat.id);
                                            setEditingChatTitle(chat.title);
                                          }}
                                        >
                                          Rename
                                        </button>
                                      )}
                                    </MenuItem>
                                    <MenuItem>
                                      {({ active }) => (
                                        <button
                                          className={`${
                                            active ? 'bg-red-100 text-red-900' : 'text-red-700'
                                          } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                                          onClick={() => setDeletingChat({ id: chat.id, title: chat.title })}
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </MenuItem>
                                  </div>
                                </MenuItems>
                              </Transition>
                            </Menu>
                          </li>
                        ))}
                        {allChats && allChats.length > INITIAL_CHAT_COUNT && (
                          <li className="py-2 px-4">
                            <button
                              onClick={() => setShowAllChats(!showAllChats)}
                              className="text-sm font-bold text-black hover:underline focus:outline-none"
                            >
                              {showAllChats ? 'See Less' : `See  More`}
                            </button>
                          </li>
                        )}
                      </>
                    )}
                  </ul>
                )}
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
                            className={`py-2 px-5 flex justify-between items-center ${
                              isActive(`/review/${deck.id}`) ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'
                            }`}
                          >
                            <span>{deck.name}</span>
                            {deck.due_count > 0 && (
                              <span className="bg-black text-white text-xs font-bold px-2 py-1 ml-1 rounded-full">
                                {deck.due_count}
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
          )}
        </div>
      </nav>
      <DeleteChatModal
        isOpen={!!deletingChat}
        onClose={() => setDeletingChat(null)}
        onConfirm={handleDeleteChat}
        chatTitle={deletingChat?.title || ''}
      />
      <CreateDeckModal isOpen={isCreateDeckModalOpen} onClose={handleCloseCreateDeckModal} />
    </>
  );
};

export default Sidebar;
