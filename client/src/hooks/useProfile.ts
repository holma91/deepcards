import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { API_BASE_URL } from '../config';

export interface Profile {
  id: string;
  theme: 'light' | 'dark' | 'system';
  review_algorithm: 'basic' | 'supermemo';
  default_chat_model: 'gpt-3.5-turbo' | 'gpt-4';
  updated_at: string;
}

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
