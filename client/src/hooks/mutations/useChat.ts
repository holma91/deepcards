// src/hooks/mutations/useChat.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { API_BASE_URL } from '../../config';
import { Message } from '../../types';

interface ChatParams {
  chatId?: string;
  messages: Message[];
}

interface ChatResponse {
  chatId: string;
  response: string;
}

const chatWithAI = async ({ chatId, messages }: ChatParams): Promise<ChatResponse> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const endpoint = chatId ? `${API_BASE_URL}/chat/${chatId}` : `${API_BASE_URL}/chat`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get AI response');
  }
  return response.json();
};

export const useChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: chatWithAI,
    onMutate: async (newChat) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['messages', newChat.chatId] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', newChat.chatId]);

      // Optimistically update messages
      queryClient.setQueryData<Message[]>(['messages', newChat.chatId], (old = []) => [
        ...old,
        newChat.messages[newChat.messages.length - 1],
      ]);

      return { previousMessages };
    },
    onError: (_, newChat, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['messages', newChat.chatId], context?.previousMessages);
    },
    onSettled: (data, _, variables) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chatId] });

      // If it's a new chat, invalidate the chats list
      if (!variables.chatId) {
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      }

      // Add the AI response to the messages
      if (data) {
        queryClient.setQueryData<Message[]>(['messages', data.chatId], (old = []) => [
          ...old,
          { role: 'assistant', content: data.response },
        ]);
      }
    },
  });
};
