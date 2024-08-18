import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../../config';
import { supabase } from '../../clients/supabaseClient';
import { Card, Chat, Message, Suggestion } from '../../types';

interface ChatResponse extends Omit<Chat, 'card_id'> {
  card: Card | null;
  messages: Message[];
  suggestions: Suggestion[];
}

const fetchChatInfo = async (chatId: string): Promise<ChatResponse> => {
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
