// src/components/Header.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';
import { Menu, MenuItem, MenuItems, Transition, MenuButton } from '@headlessui/react';
import { Fragment } from 'react';

interface HeaderProps {
  showSidebarToggle: boolean | null;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ showSidebarToggle, onToggleSidebar }) => {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleAuthAction = async () => {
    if (session) {
      await signOut();
      navigate('/');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const renderLoggedInHeader = () => (
    <div className="flex items-center justify-between h-16 px-6 w-full">
      <div className="flex items-center">
        {showSidebarToggle && (
          <div className="flex items-center">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-full hover:bg-gray-100 mr-4"
              aria-label="Show Sidebar"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
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
        )}
      </div>
      <div className="flex items-center">
        <Menu as="div" className="relative inline-block text-left">
          <div>
            <MenuButton className="inline-flex justify-center w-full rounded-md px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </MenuButton>
          </div>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <MenuItems className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="py-1">
                <MenuItem>
                  {({ active }) => (
                    <a
                      href="#"
                      className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-4 py-2 text-sm`}
                      onClick={() => navigate('/settings')}
                    >
                      Settings
                    </a>
                  )}
                </MenuItem>
                <MenuItem>
                  {({ active }) => (
                    <a
                      href="#"
                      className={`${active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'} block px-4 py-2 text-sm`}
                      onClick={handleSignOut}
                    >
                      Log out
                    </a>
                  )}
                </MenuItem>
              </div>
            </MenuItems>
          </Transition>
        </Menu>
      </div>
    </div>
  );

  const renderLoggedOutHeader = () => (
    <div className="container mx-auto px-4 h-full">
      <div className="flex items-center justify-between h-full max-w-4xl mx-auto">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-black">Deepcards</h1>
        </div>
        <div className="flex items-center">
          <button
            onClick={handleAuthAction}
            className="px-4 py-2 rounded transition-colors bg-black text-white hover:bg-gray-800"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <header className="bg-white z-10 h-16">
      {session ? renderLoggedInHeader() : renderLoggedOutHeader()}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} isGetStarted={false} />
    </header>
  );
};

export default Header;
