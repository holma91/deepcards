// useCreateChat.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { API_BASE_URL } from '../../config';
import { Message, Chat, ChatResponse } from '../../types';

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
      const tempChatId = 'temp-' + Date.now();
      await queryClient.cancelQueries({ queryKey: ['chatInfo', tempChatId] });

      const tempChatInfo: ChatResponse = {
        id: tempChatId,
        title: newChat.message.substring(0, 50) + '...',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: '', // This will be filled in by the server
        card_id: newChat.cardId || null,
        card: null,
        messages: [{ role: 'user', content: newChat.message, created_at: new Date().toISOString() } as Message],
        suggestions: [],
      };

      queryClient.setQueryData<ChatResponse>(['chatInfo', tempChatId], tempChatInfo);

      queryClient.setQueryData<Chat[]>(['chats'], (old = []) => [tempChatInfo, ...old]);

      return { tempChatId };
    },
    onError: (_, __, context) => {
      if (context?.tempChatId) {
        queryClient.removeQueries({ queryKey: ['chatInfo', context.tempChatId] });
        queryClient.setQueryData<Chat[]>(['chats'], (old = []) => old.filter((chat) => chat.id !== context.tempChatId));
      }
    },
    onSuccess: (data, variables, context) => {
      if (context?.tempChatId) {
        const tempChatInfo = queryClient.getQueryData<ChatResponse>(['chatInfo', context.tempChatId]);
        if (tempChatInfo) {
          const updatedChatInfo: ChatResponse = {
            ...tempChatInfo,
            id: data.chatId,
            messages: [
              ...tempChatInfo.messages,
              { role: 'assistant', content: data.response, created_at: new Date().toISOString() } as Message,
            ],
          };
          queryClient.setQueryData<ChatResponse>(['chatInfo', data.chatId], updatedChatInfo);
          queryClient.removeQueries({ queryKey: ['chatInfo', context.tempChatId] });
        }
      } else {
        const newChatInfo: ChatResponse = {
          id: data.chatId,
          title: variables.message.substring(0, 50) + '...',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user_id: '', // This will be filled in by the server
          card_id: variables.cardId || null,
          card: null,
          messages: [
            { role: 'user', content: variables.message, created_at: new Date().toISOString() } as Message,
            { role: 'assistant', content: data.response, created_at: new Date().toISOString() } as Message,
          ],
          suggestions: [],
        };
        queryClient.setQueryData<ChatResponse>(['chatInfo', data.chatId], newChatInfo);
      }

      queryClient.setQueryData<Chat[]>(['chats'], (old = []) => {
        const updatedChats = old.map((chat) => (chat.id === context?.tempChatId ? { ...chat, id: data.chatId } : chat));
        return updatedChats;
      });

      queryClient.invalidateQueries({ queryKey: ['chats'] });
    },
  });
};
