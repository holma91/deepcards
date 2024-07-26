// src/hooks/useLoginWithGoogle.ts
import { useState } from 'react';
import { supabase } from '../supabaseClient';

export const useLoginWithGoogle = () => {
  const [loading, setLoading] = useState(false);

  const loginWithGoogle = async () => {
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

  return { loginWithGoogle, loading };
};
