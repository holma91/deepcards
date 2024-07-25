import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

const Header: React.FC = () => {
  const { session } = useAuth();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    }
  };

  return (
    <header className="bg-white">
      <div className="max-w-7xl mx-auto py-6 px-4 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-black">DeepFlash</h1>
        {session && (
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
          >
            Log out
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
