// src/hooks/useCards.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';

export interface Card {
  id: string;
  front: string;
  back: string;
  created_at: string;
}

const fetchCards = async (deckId: string): Promise<Card[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(
    `http://localhost:3001/api/cards/deck/${deckId}`,
    {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  );

  if (!response.ok) throw new Error('Failed to fetch cards');
  return response.json();
};

export const useCards = (deckId: string) => {
  return useQuery({
    queryKey: ['cards', deckId],
    queryFn: () => fetchCards(deckId),
    enabled: !!deckId,
  });
};
