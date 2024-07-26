// src/components/Header.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLoginWithGoogle } from '../hooks/useLoginWithGoogle';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { session, signOut } = useAuth();
  const { loginWithGoogle, loading } = useLoginWithGoogle();

  const handleAuthAction = async () => {
    if (session) {
      await signOut();
      navigate('/login');
    } else {
      await loginWithGoogle();
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10 h-16">
      <div className="flex justify-between items-center h-16 px-6">
        <h1 className="text-2xl font-bold text-black">deepcards</h1>
        <div className="flex items-center">
          {session && (
            <button
              onClick={() => navigate('/settings')}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Settings"
            ></button>
          )}
          <button
            onClick={handleAuthAction}
            disabled={loading}
            className={`ml-4 px-4 py-2 rounded transition-colors ${
              session
                ? 'border border-black text-black hover:bg-gray-100'
                : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {session
              ? 'Logout'
              : loading
              ? 'Loading...'
              : 'Sign in with Google'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
