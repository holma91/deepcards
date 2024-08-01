// src/hooks/useAllDueCards.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { Card } from '../types';
import { API_BASE_URL } from '../config';

const fetchAllDueCards = async (): Promise<Card[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session');
  }

  const response = await fetch(`${API_BASE_URL}/cards/due`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch due cards');
  }

  return response.json();
};

export const useAllDueCards = () => {
  return useQuery({
    queryKey: ['cards', 'due'],
    queryFn: fetchAllDueCards,
  });
};
