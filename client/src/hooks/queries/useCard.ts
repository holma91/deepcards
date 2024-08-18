import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../clients/supabaseClient';
import { API_BASE_URL } from '../../config';
import { Card } from '../../types';

const fetchCard = async (cardId: string): Promise<Card> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Card not found');
    }
    throw new Error('Failed to fetch card');
  }
  return response.json();
};

export const useCard = (cardId: string | undefined) => {
  return useQuery({
    queryKey: ['card', cardId],
    queryFn: () => fetchCard(cardId!),
    enabled: !!cardId,
  });
};
