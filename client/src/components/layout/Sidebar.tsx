// src/components/layout/Sidebar.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { useDecksDueCounts } from '../../hooks/useDecksDueCounts';
import { useDecks } from '../../hooks/useDecks';
import CreateDeckModal from '../modals/CreateDeckModal';
import DeleteChatModal from '../modals/DeleteChatModal';
import { useKeyboardShortcuts } from '../../contexts/KeyboardShortcutContext';
import { useChats } from '../../hooks/useChats';
import { useRenameChat } from '../../hooks/mutations/useRenameChat';
import { useDeleteChat } from '../../hooks/mutations/useDeleteChat';

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

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity duration-300 lg:hidden ${
          isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        onClick={onToggle}
      ></div>
      <nav
        className={`bg-gray-100 h-screen w-64 lg:w-72 flex flex-col fixed top-0 left-0 z-30 transform transition-transform duration-300 ${
          isCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className="sticky top-0 z-10 bg-gray-100 p-3 border-b border-gray-200 flex justify-between items-center">
          <button
            onClick={onToggle}
            className="p-2 rounded-md hover:bg-gray-200 focus:outline-none transition-colors duration-200"
            aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <Link
            to="/chat"
            className="p-2 rounded-md hover:bg-gray-200 focus:outline-none transition-colors duration-200"
            aria-label="New Chat"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>
        <div className="flex-grow overflow-y-auto text-sm">
          {!isCollapsed && (
            <ul className="space-y-1 p-2">
              <SidebarItem
                to="/chat"
                label="Chat"
                isActive={isActive('/chat')}
                isExpanded={isChatsExpanded}
                onClick={handleChatsClick}
                badge={null}
              >
                {isChatsExpanded && (
                  <ul className="mt-1 ml-4 space-y-1">
                    {isLoadingChats ? (
                      <li className="py-2 px-3 text-gray-500">Loading chats...</li>
                    ) : chatsError ? (
                      <li className="py-2 px-3 text-red-500">Error loading chats</li>
                    ) : (
                      <>
                        {visibleChats?.map((chat) => (
                          <ChatItem
                            key={chat.id}
                            chat={chat}
                            isActive={isActive(`/chat/${chat.id}`)}
                            editingChatId={editingChatId}
                            editingChatTitle={editingChatTitle}
                            setEditingChatId={setEditingChatId}
                            setEditingChatTitle={setEditingChatTitle}
                            handleRenameChat={handleRenameChat}
                            setDeletingChat={setDeletingChat}
                          />
                        ))}
                        {allChats && allChats.length > INITIAL_CHAT_COUNT && (
                          <li className="py-2 px-3">
                            <button
                              onClick={() => setShowAllChats(!showAllChats)}
                              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
                            >
                              {showAllChats ? 'See Less' : `See More`}
                            </button>
                          </li>
                        )}
                      </>
                    )}
                  </ul>
                )}
              </SidebarItem>
              <SidebarItem
                to="/review"
                label="Review"
                isActive={isActive('/review')}
                isExpanded={isReviewExpanded}
                onClick={handleReviewClick}
                badge={totalDueCards > 0 ? totalDueCards : null}
              >
                {isReviewExpanded && (
                  <ul className="mt-1 ml-4 space-y-1">
                    {isLoadingDueCounts ? (
                      <li className="py-2 px-3 text-gray-500">Loading decks...</li>
                    ) : dueCountsError ? (
                      <li className="py-2 px-3 text-red-500">Error loading decks</li>
                    ) : (
                      decksDueCounts?.map((deck) => (
                        <SidebarItem
                          key={deck.id}
                          to={`/review/${deck.id}`}
                          label={deck.name}
                          isActive={isActive(`/review/${deck.id}`)}
                          badge={deck.due_count > 0 ? deck.due_count : null}
                        />
                      ))
                    )}
                  </ul>
                )}
              </SidebarItem>
              <SidebarItem
                to="/cards"
                label="Cards"
                isActive={isActive('/cards')}
                isExpanded={isCardsExpanded}
                onClick={handleCardsClick}
              >
                {isCardsExpanded && (
                  <ul className="mt-1 ml-4 space-y-1">
                    <li>
                      <button
                        onClick={handleOpenCreateDeckModal}
                        className="w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors duration-200"
                      >
                        + New Deck
                      </button>
                    </li>
                    {isLoadingDecks ? (
                      <li className="py-2 px-3 text-gray-500">Loading decks...</li>
                    ) : decksError ? (
                      <li className="py-2 px-3 text-red-500">Error loading decks</li>
                    ) : (
                      allDecks?.map((deck) => (
                        <SidebarItem
                          key={deck.id}
                          to={`/cards/${deck.id}`}
                          label={deck.name}
                          isActive={isActive(`/cards/${deck.id}`)}
                        />
                      ))
                    )}
                  </ul>
                )}
              </SidebarItem>
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

interface SidebarItemProps {
  to: string;
  label: string;
  isActive: boolean;
  isExpanded?: boolean;
  onClick?: () => void;
  badge?: number | null;
  children?: React.ReactNode;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ to, label, isActive, isExpanded, onClick, badge, children }) => (
  <li>
    <Link
      to={to}
      onClick={onClick}
      className={`block py-2 px-3 rounded transition-colors duration-200 ${
        isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
      }`}
    >
      <div className="flex justify-between items-center">
        <span className="truncate flex-grow mr-2">{label}</span>
        <div className="flex items-center space-x-2 flex-shrink-0">
          {badge !== undefined && badge !== null && (
            <span className="bg-gray-700 text-white text-xs font-medium px-2 py-0.5 rounded-full">{badge}</span>
          )}
          {onClick && (
            <svg
              className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>
    </Link>
    {children}
  </li>
);

interface ChatItemProps {
  chat: { id: string; title: string };
  isActive: boolean;
  editingChatId: string | null;
  editingChatTitle: string;
  setEditingChatId: (id: string | null) => void;
  setEditingChatTitle: (title: string) => void;
  handleRenameChat: (id: string, title: string) => void;
  setDeletingChat: (chat: { id: string; title: string } | null) => void;
}

const isMobileDevice = () => {
  return /Mobi|Android/i.test(navigator.userAgent);
};

const ChatItem: React.FC<ChatItemProps> = ({
  chat,
  isActive,
  editingChatId,
  editingChatTitle,
  setEditingChatId,
  setEditingChatTitle,
  handleRenameChat,
  setDeletingChat,
}) => {
  const editInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (editingChatId === chat.id && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingChatId, chat.id]);

  const handleChatClick = (e: React.MouseEvent) => {
    // Only navigate if we're not clicking on the menu
    if (!(e.target as HTMLElement).closest('.chat-menu')) {
      navigate(`/chat/${chat.id}`);
    }
  };

  return (
    <li className={`group ${isActive ? 'bg-gray-200' : 'hover:bg-gray-200'} rounded`}>
      {editingChatId === chat.id ? (
        <input
          ref={editInputRef}
          value={editingChatTitle}
          onChange={(e) => setEditingChatTitle(e.target.value)}
          onBlur={() => handleRenameChat(chat.id, editingChatTitle)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleRenameChat(chat.id, editingChatTitle);
            }
          }}
          className="w-full bg-white px-3 py-2 rounded"
        />
      ) : (
        <div
          onClick={handleChatClick}
          className={`flex items-center justify-between w-full px-3 py-2 rounded transition-colors duration-200 cursor-pointer ${
            isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
          }`}
        >
          <span className="truncate flex-grow mr-2">{chat.title}</span>
          {!isMobileDevice() ? (
            <Menu as="div" className="relative inline-block text-left chat-menu">
              <MenuButton className="p-1 rounded-full hover:bg-gray-300 focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              </MenuButton>
              <MenuItems className="absolute right-0 w-56 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="px-1 py-1">
                  <MenuItem>
                    {({ active }) => (
                      <button
                        className={`${
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                        onClick={(e) => {
                          e.stopPropagation();
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
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                        } group flex rounded-md items-center w-full px-2 py-2 text-sm`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingChat({ id: chat.id, title: chat.title });
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </MenuItem>
                </div>
              </MenuItems>
            </Menu>
          ) : null}
        </div>
      )}
    </li>
  );
};

export default Sidebar;
