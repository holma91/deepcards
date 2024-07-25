import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { Deck } from '../types';

const fetchDecks = async (): Promise<Deck[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch('http://localhost:3001/api/cards/decks', {
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
