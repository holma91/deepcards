import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) throw error;
    } catch (error: unknown) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <h1 className="text-3xl font-bold mb-8">Deepcards</h1>
      <button
        onClick={handleLogin}
        disabled={loading}
        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
      >
        {loading ? 'Loading...' : 'Sign in with Google'}
      </button>
    </div>
  );
};

export default Login;
