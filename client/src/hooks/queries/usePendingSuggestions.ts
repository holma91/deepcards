import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../clients/supabaseClient';
import { API_BASE_URL } from '../../config';
import { Suggestion } from '../../types';

const fetchPendingSuggestions = async (chatId: string): Promise<Suggestion[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/suggestions/pending/${chatId}`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch pending suggestions');
  return response.json();
};

export const usePendingSuggestions = (chatId: string) => {
  return useQuery({
    queryKey: ['pendingSuggestions', chatId],
    queryFn: () => fetchPendingSuggestions(chatId),
    enabled: !!chatId,
  });
};
