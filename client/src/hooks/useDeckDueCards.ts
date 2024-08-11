// src/hooks/useDeckDueCards.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { API_BASE_URL } from '../config';
import { CardWithDecks } from '../types';

const fetchDeckDueCards = async (deckId: string): Promise<CardWithDecks[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session');
  }

  const response = await fetch(`${API_BASE_URL}/cards/deck/${deckId}/due`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch due cards for deck');
  }

  return response.json();
};

export const useDeckDueCards = (deckId: string | undefined) => {
  return useQuery({
    queryKey: ['cards', 'due', deckId],
    queryFn: () => fetchDeckDueCards(deckId!),
    enabled: !!deckId,
  });
};
