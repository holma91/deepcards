// src/components/Header.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';

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

  return (
    <header className="bg-white z-10 h-16">
      <div className="flex items-center justify-between h-16 px-6">
        <div>
          {showSidebarToggle && (
            <button onClick={onToggleSidebar} className="p-2 rounded-full hover:bg-gray-100" aria-label="Show Sidebar">
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
          )}
        </div>
        <div className="flex items-center">
          {session && (
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-full hover:bg-gray-100 mr-4"
              aria-label="Settings"
            ></button>
          )}
          <button
            onClick={handleAuthAction}
            className={`px-4 py-2 rounded transition-colors ${
              session ? 'border border-black text-black hover:bg-gray-100' : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {session ? 'Logout' : 'Sign In'}
          </button>
        </div>
      </div>
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} isGetStarted={false} />
    </header>
  );
};

export default Header;
