// src/hooks/mutations/useDeleteSuggestions.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { API_BASE_URL } from '../../config';
import { Suggestion } from '../../types';

interface DeleteSuggestionsParams {
  suggestionIds: string[];
  chatId: string;
}

const deleteSuggestions = async ({ suggestionIds }: DeleteSuggestionsParams): Promise<Suggestion[]> => {
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

  if (!response.ok) throw new Error('Failed to delete suggestions');
  return response.json();
};

export const useDeleteSuggestions = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSuggestions,
    onMutate: async ({ suggestionIds, chatId }) => {
      await queryClient.cancelQueries({ queryKey: ['pendingSuggestions', chatId] });

      const previousSuggestions = queryClient.getQueryData<Suggestion[]>(['pendingSuggestions', chatId]);

      queryClient.setQueryData<Suggestion[]>(['pendingSuggestions', chatId], (old = []) =>
        old.filter((suggestion) => !suggestionIds.includes(suggestion.id))
      );

      return { previousSuggestions };
    },
    onError: (_, { chatId }, context) => {
      queryClient.setQueryData(['pendingSuggestions', chatId], context?.previousSuggestions);
    },
    onSettled: (_, __, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: ['pendingSuggestions', chatId] });
    },
  });
};
