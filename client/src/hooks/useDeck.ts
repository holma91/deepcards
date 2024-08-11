// src/hooks/useDeck.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { API_BASE_URL } from '../config';
import { Deck } from '../types';

const fetchDeck = async (deckId: string): Promise<Deck> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/decks/${deckId}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Deck not found');
    }
    throw new Error('Failed to fetch deck');
  }
  return response.json();
};

export const useDeck = (deckId: string | undefined) => {
  return useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => fetchDeck(deckId!),
    enabled: !!deckId,
  });
};
