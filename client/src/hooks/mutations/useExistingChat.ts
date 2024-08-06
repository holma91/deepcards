// useExistingChat.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { API_BASE_URL } from '../../config';
import { Message } from '../../types';

interface ExistingChatParams {
  chatId: string;
  message: string;
}

interface ChatResponse {
  response: string;
}

const sendMessageToExistingChat = async ({ chatId, message }: ExistingChatParams): Promise<ChatResponse> => {
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
      await queryClient.cancelQueries({ queryKey: ['messages', newChat.chatId] });
      const previousMessages = queryClient.getQueryData<Message[]>(['messages', newChat.chatId]);

      queryClient.setQueryData<Message[]>(['messages', newChat.chatId], (old = []) => [
        ...old,
        { role: 'user', content: newChat.message },
      ]);

      return { previousMessages };
    },
    onError: (_, newChat, context) => {
      queryClient.setQueryData(['messages', newChat.chatId], context?.previousMessages);
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<Message[]>(['messages', variables.chatId], (old = []) => [
        ...old,
        { role: 'assistant', content: data.response },
      ]);
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.chatId] });
    },
  });
};
