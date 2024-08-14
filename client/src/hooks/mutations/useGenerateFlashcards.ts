import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { API_BASE_URL } from '../../config';
import { Suggestion } from '../../types';

interface GenerateFlashcardsParams {
  chatId: string;
}

interface GenerateFlashcardsResponse {
  suggestions: Suggestion[];
}

const generateFlashcards = async ({ chatId }: GenerateFlashcardsParams): Promise<GenerateFlashcardsResponse> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/chat/${chatId}/cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to generate flashcards');
  }
  return response.json();
};

export const useGenerateFlashcards = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateFlashcards,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['pendingSuggestions', variables.chatId] });
      await queryClient.cancelQueries({ queryKey: ['chatInfo', variables.chatId] });

      // Snapshot the previous values
      const previousPendingSuggestions = queryClient.getQueryData<Suggestion[]>([
        'pendingSuggestions',
        variables.chatId,
      ]);
      const previousChatInfo = queryClient.getQueryData(['chatInfo', variables.chatId]);

      // Optimistically update to show that suggestions are being generated
      queryClient.setQueryData<Suggestion[]>(['pendingSuggestions', variables.chatId], []);
      queryClient.setQueryData(['chatInfo', variables.chatId], (old: any) => ({
        ...old,
        isGeneratingSuggestions: true,
      }));

      // Return a context with the snapshotted values
      return { previousPendingSuggestions, previousChatInfo };
    },
    onError: (_, variables, context) => {
      // If the mutation fails, use the context to roll back
      queryClient.setQueryData(['pendingSuggestions', variables.chatId], context?.previousPendingSuggestions);
      queryClient.setQueryData(['chatInfo', variables.chatId], context?.previousChatInfo);
    },
    onSettled: (data, _, variables) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['pendingSuggestions', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['chatInfo', variables.chatId] });

      // If successful, update the pendingSuggestions query with the new suggestions
      if (data) {
        queryClient.setQueryData<Suggestion[]>(['pendingSuggestions', variables.chatId], data.suggestions);
      }
    },
  });
};
