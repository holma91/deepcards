// src/hooks/useDeckCards.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { API_BASE_URL } from '../config';
import { Card } from '../types';

const fetchDeckCards = async (deckId: string): Promise<Card[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/cards/deck/${deckId}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch deck cards');
  return response.json();
};

export const useDeckCards = (deckId: string) => {
  return useQuery({
    queryKey: ['cards', deckId],
    queryFn: () => fetchDeckCards(deckId),
    enabled: !!deckId,
  });
};
