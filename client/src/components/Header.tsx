// src/components/Header.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from './LoginModal';

const Header: React.FC = () => {
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
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10 h-16">
      <div
        className={`flex items-center h-16 ${
          session ? 'px-6' : 'container mx-auto px-4'
        }`}
      >
        <div
          className={`flex justify-between items-center w-full ${
            session ? '' : 'max-w-4xl mx-auto'
          }`}
        >
          <h1 className="text-2xl font-bold text-black">deepcards</h1>
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
                session
                  ? 'border border-black text-black hover:bg-gray-100'
                  : 'bg-black text-white hover:bg-gray-800'
              }`}
            >
              {session ? 'Logout' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        isGetStarted={false}
      />
    </header>
  );
};

export default Header;
