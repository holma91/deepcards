import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../clients/supabaseClient';
import { API_BASE_URL } from '../../config';
import { Card } from '../../types';

const fetchAllCards = async (): Promise<Card[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/cards`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch all cards');
  return response.json();
};

export const useAllCards = () => {
  return useQuery({
    queryKey: ['cards'],
    queryFn: fetchAllCards,
  });
};
