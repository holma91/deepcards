// src/hooks/useReviews.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { Card } from '../types';
import { API_BASE_URL } from '../config';

const fetchCards = async (deckId?: string): Promise<Card[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session');
  }

  const url = deckId
    ? `${API_BASE_URL}/cards/deck/${deckId}/due`
    : `${API_BASE_URL}/cards/due`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch cards');
  }

  return response.json();
};

export const useReviews = (deckId?: string) => {
  return useQuery({
    queryKey: ['cards', 'due', deckId],
    queryFn: () => fetchCards(deckId),
  });
};
