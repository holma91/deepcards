// useExistingChat.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { API_BASE_URL } from '../../config';
import { Message, ChatResponse, Chat } from '../../types';

interface ExistingChatParams {
  chatId: string;
  message: string;
}

interface AIResponse {
  response: string;
}

const sendMessageToExistingChat = async ({ chatId, message }: ExistingChatParams): Promise<AIResponse> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/chat/${chatId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get AI response');
  }
  return response.json();
};

export const useExistingChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMessageToExistingChat,
    onMutate: async (newChat) => {
      await queryClient.cancelQueries({ queryKey: ['chatInfo', newChat.chatId] });
      const previousChatInfo = queryClient.getQueryData<ChatResponse>(['chatInfo', newChat.chatId]);

      queryClient.setQueryData<ChatResponse>(['chatInfo', newChat.chatId], (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: [
            ...old.messages,
            { role: 'user', content: newChat.message, created_at: new Date().toISOString() } as Message,
          ],
        };
      });

      // Optimistically update chats list
      queryClient.setQueryData<Chat[]>(['chats'], (old) => {
        if (!old) return old;
        const updatedChat = old.find((chat) => chat.id === newChat.chatId);
        if (!updatedChat) return old;

        return [
          { ...updatedChat, updated_at: new Date().toISOString() },
          ...old.filter((chat) => chat.id !== newChat.chatId),
        ];
      });

      return { previousChatInfo };
    },
    onError: (_, newChat, context) => {
      queryClient.setQueryData(['chatInfo', newChat.chatId], context?.previousChatInfo);
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<ChatResponse>(['chatInfo', variables.chatId], (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: [
            ...old.messages,
            { role: 'assistant', content: data.response, created_at: new Date().toISOString() } as Message,
          ],
        };
      });
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chatInfo', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};
