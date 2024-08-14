// src/hooks/mutations/useDeleteChat.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { API_BASE_URL } from '../../config';

const deleteChat = async (chatId: string): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/chats/${chatId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) throw new Error('Failed to delete chat');
};

export const useDeleteChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteChat,
    onSuccess: (_, chatId) => {
      queryClient.invalidateQueries({ queryKey: ['chats'] });

      // below invalidations are necessary when deleting chats in review mode
      queryClient.invalidateQueries({ queryKey: ['cards', 'due'] });

      // Invalidate all deck-specific due cards queries
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === 'cards' && query.queryKey[1] === 'due' && query.queryKey.length === 3,
      });

      queryClient.removeQueries({ queryKey: ['messages', chatId] });
    },
  });
};
