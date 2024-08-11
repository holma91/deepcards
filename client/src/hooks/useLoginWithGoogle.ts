import { supabase } from '../utils/supabaseClient';

export const useLoginWithGoogle = () => {
  const loginWithGoogle = async (redirectPath: string) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${redirectPath}`,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
    if (error) {
      console.error('Google sign-in error:', error.message);
      return false;
    }
    return true;
  };

  return { loginWithGoogle };
};
