// src/hooks/useMessages.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { API_BASE_URL } from '../config';
import { Message } from '../types';

const fetchMessages = async (chatId: string): Promise<Message[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/chats/${chatId}/messages`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch chat messages');
  return response.json();
};

export const useMessages = (chatId: string | undefined) => {
  return useQuery({
    queryKey: ['messages', chatId],
    queryFn: () => fetchMessages(chatId!),
    enabled: !!chatId,
  });
};
