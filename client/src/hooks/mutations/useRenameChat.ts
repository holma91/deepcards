import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../clients/supabaseClient';
import { API_BASE_URL } from '../../config';

interface RenameChatParams {
  chatId: string;
  title: string;
}

const renameChat = async ({ chatId, title }: RenameChatParams): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) throw new Error('Failed to rename chat');
};

export const useRenameChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: renameChat,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chatId] });
    },
  });
};
