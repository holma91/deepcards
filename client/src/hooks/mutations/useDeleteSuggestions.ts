// src/hooks/mutations/useDeleteSuggestions.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { API_BASE_URL } from '../../config';

interface DeleteSuggestionsParams {
  suggestionIds: string[];
  chatId: string;
}

const deleteSuggestions = async ({ suggestionIds }: DeleteSuggestionsParams): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/suggestions`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ suggestionIds }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete suggestions');
  }
};

export const useDeleteSuggestions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSuggestions,
    onMutate: async ({ suggestionIds, chatId }) => {
      await queryClient.cancelQueries({ queryKey: ['chatInfo', chatId] });

      const previousChatInfo = queryClient.getQueryData(['chatInfo', chatId]);

      queryClient.setQueryData(['chatInfo', chatId], (old: any) => {
        const updatedSuggestions = old.suggestions.filter((s: any) => !suggestionIds.includes(s.id));
        return { ...old, suggestions: updatedSuggestions };
      });

      return { previousChatInfo };
    },
    onError: (_, { chatId }, context) => {
      queryClient.setQueryData(['chatInfo', chatId], context?.previousChatInfo);
    },
    onSettled: (_, __, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: ['chatInfo', chatId] });
    },
  });
};
