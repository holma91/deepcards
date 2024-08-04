import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { Chat } from '../types';
import { API_BASE_URL } from '../config';

const fetchChats = async (): Promise<Chat[]> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/chats`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) throw new Error('Failed to fetch chats');
  return response.json();
};

export const useChats = () => {
  return useQuery({
    queryKey: ['chats'],
    queryFn: fetchChats,
  });
};
