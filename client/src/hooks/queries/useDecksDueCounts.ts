import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../clients/supabaseClient';
import { API_BASE_URL } from '../../config';

export interface DeckDueCount {
  id: string;
  name: string;
  due_count: number;
}

const fetchDecksDueCounts = async (): Promise<DeckDueCount[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/cards/decks/due-counts`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch deck due counts');
  return response.json();
};

export const useDecksDueCounts = () => {
  return useQuery({
    queryKey: ['decks', 'dueCounts'],
    queryFn: fetchDecksDueCounts,
  });
};
