// src/hooks/useCards.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { API_BASE_URL } from '../config';
import { Card } from '../types';

const fetchCards = async (deckId?: string): Promise<Card[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const url = deckId
    ? `${API_BASE_URL}/cards/deck/${deckId}`
    : `${API_BASE_URL}/cards`;
  console.log('url', url);
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch cards');
  return response.json();
};

export const useCards = (deckId?: string) => {
  return useQuery({
    queryKey: deckId ? ['cards', deckId] : ['cards'],
    queryFn: () => fetchCards(deckId),
  });
};
