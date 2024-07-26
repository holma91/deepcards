// src/components/Login.tsx
import React from 'react';
import { useLoginWithGoogle } from '../hooks/useLoginWithGoogle';

const Login: React.FC = () => {
  const { loginWithGoogle, loading } = useLoginWithGoogle();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <h1 className="text-3xl font-bold mb-8">Deepcards</h1>
      <button
        onClick={loginWithGoogle}
        disabled={loading}
        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
      >
        {loading ? 'Loading...' : 'Sign in with Google'}
      </button>
    </div>
  );
};

export default Login;
