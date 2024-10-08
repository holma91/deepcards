import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../clients/supabaseClient';
import { API_BASE_URL } from '../../config';
import { Deck } from '../../types';

const fetchDecks = async (): Promise<Deck[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/decks`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch decks');
  return response.json();
};

export const useDecks = () => {
  return useQuery({
    queryKey: ['decks'],
    queryFn: fetchDecks,
  });
};
