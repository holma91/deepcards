import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { Card } from '../types';

const fetchCards = async (): Promise<Card[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session');
  }

  const response = await fetch('http://localhost:3001/api/cards', {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch cards');
  }

  return response.json();
};

export const useCards = () => {
  return useQuery({
    queryKey: ['cards'],
    queryFn: fetchCards,
  });
};
