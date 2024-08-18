import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../clients/supabaseClient';
import { API_BASE_URL } from '../../config';
import { Profile } from '../../types';

const fetchProfile = async (): Promise<Profile> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/profiles`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }
  return response.json();
};

export const useProfile = () => {
  return useQuery<Profile, Error>({
    queryKey: ['profile'],
    queryFn: fetchProfile,
  });
};
