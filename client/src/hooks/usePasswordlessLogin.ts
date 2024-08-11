import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export const usePasswordlessLogin = () => {
  const [loading, setLoading] = useState(false);

  const sendMagicLink = async (email: string, redirectTo: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${redirectTo}`,
      },
    });
    setLoading(false);
    return { error };
  };

  const verifyOtp = async (email: string, token: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    setLoading(false);
    return { data, error };
  };

  return { sendMagicLink, verifyOtp, loading };
};
