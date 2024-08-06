// src/hooks/useChatInfo.ts

import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../config';
import { Chat, Card } from '../types';
import { supabase } from '../utils/supabaseClient';

interface ChatWithCard extends Chat {
  card?: Card;
}

const fetchChatInfo = async (chatId: string): Promise<ChatWithCard> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to fetch chat info');
  }

  return response.json();
};

export const useChatInfo = (chatId: string | undefined) => {
  return useQuery({
    queryKey: ['chatInfo', chatId],
    queryFn: () => (chatId ? fetchChatInfo(chatId) : null),
    enabled: !!chatId,
  });
};
