import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, MenuItem, MenuItems, Transition, MenuButton } from '@headlessui/react';

interface HeaderProps {
  showSidebarToggle: boolean;
  onToggleSidebar: () => void;
  isSidebarCollapsed: boolean;
  onOpenSettings: () => void; // New prop for opening settings modal
}

const Header: React.FC<HeaderProps> = ({ showSidebarToggle, onToggleSidebar, isSidebarCollapsed, onOpenSettings }) => {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const renderLoggedInHeader = () => (
    <div className="flex items-center justify-between h-16 px-4">
      <div className="flex items-center space-x-4">
        {showSidebarToggle && (
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
            aria-label={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <Link
          to="/chat"
          className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
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
      <Menu as="div" className="relative">
        <MenuButton className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-200">
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
        <Transition
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <MenuItems className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              <MenuItem>
                {({ active }) => (
                  <button
                    onClick={onOpenSettings}
                    className={`${active ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700`}
                  >
                    Settings
                  </button>
                )}
              </MenuItem>
              <MenuItem>
                {({ active }) => (
                  <button
                    onClick={handleSignOut}
                    className={`${active ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700`}
                  >
                    Log out
                  </button>
                )}
              </MenuItem>
            </div>
          </MenuItems>
        </Transition>
      </Menu>
    </div>
  );

  const renderLoggedOutHeader = () => (
    <div className="container mx-auto px-4 h-full">
      <div className="flex items-center justify-between h-full max-w-4xl mx-auto">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-black">Deepcards</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/signin')}
            className="px-4 py-2 rounded transition-colors bg-white text-black border border-gray-300 hover:bg-gray-100"
          >
            Log in
          </button>
          <button
            onClick={() => navigate('/signup')}
            className="px-4 py-2 rounded transition-colors bg-black text-white hover:bg-gray-800"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <header className="bg-white z-10 h-16  sticky top-0">
      {session ? renderLoggedInHeader() : renderLoggedOutHeader()}
    </header>
  );
};

export default Header;
