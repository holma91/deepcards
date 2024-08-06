// useCreateChat.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { API_BASE_URL } from '../../config';
import { Message } from '../../types';

interface CreateChatParams {
  message: string;
  cardId?: string;
}

interface CreateChatResponse {
  chatId: string;
  response: string;
}

const createNewChat = async ({ message, cardId }: CreateChatParams): Promise<CreateChatResponse> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ message, cardId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create new chat');
  }
  return response.json();
};

export const useCreateChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNewChat,
    onMutate: async (newChat) => {
      // Generate a temporary chat ID
      const tempChatId = 'temp-' + Date.now();

      // Cancel any outgoing refetches for the new chat
      await queryClient.cancelQueries({ queryKey: ['messages', tempChatId] });

      // Optimistically update the messages for the new chat
      queryClient.setQueryData<Message[]>(['messages', tempChatId], [{ role: 'user', content: newChat.message }]);

      // Optimistically update the chats list
      queryClient.setQueryData<any[]>(['chats'], (old = []) => [
        { id: tempChatId, title: newChat.message.substring(0, 50) + '...', createdAt: new Date().toISOString() },
        ...old,
      ]);

      return { tempChatId };
    },
    onError: (_, __, context) => {
      // If the mutation fails, remove the optimistic updates
      if (context?.tempChatId) {
        queryClient.removeQueries({ queryKey: ['messages', context.tempChatId] });
        queryClient.setQueryData<any[]>(['chats'], (old = []) => old.filter((chat) => chat.id !== context.tempChatId));
      }
    },
    onSuccess: (data, variables, context) => {
      // Update the messages with the real chat ID and add the AI response
      if (context?.tempChatId) {
        const messages = queryClient.getQueryData<Message[]>(['messages', context.tempChatId]);
        queryClient.setQueryData<Message[]>(
          ['messages', data.chatId],
          [...(messages || []), { role: 'assistant', content: data.response }]
        );
        queryClient.removeQueries({ queryKey: ['messages', context.tempChatId] });
      } else {
        queryClient.setQueryData<Message[]>(
          ['messages', data.chatId],
          [
            { role: 'user', content: variables.message },
            { role: 'assistant', content: data.response },
          ]
        );
      }

      // Update the chats list with the real chat ID
      queryClient.setQueryData<any[]>(['chats'], (old = []) => {
        const updatedChats = old.map((chat) => (chat.id === context?.tempChatId ? { ...chat, id: data.chatId } : chat));
        return updatedChats;
      });

      // Invalidate and refetch the chats query to ensure it's up to date
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};
