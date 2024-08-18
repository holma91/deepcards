import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../clients/supabaseClient';
import { API_BASE_URL } from '../../config';
import { Suggestion, Card } from '../../types';

interface AcceptSuggestionParams {
  suggestionId: string;
  deckId: string;
  deckName: string;
  chatId: string;
}

interface AcceptSuggestionResponse {
  suggestion: Suggestion;
  card: Card;
}

const acceptSuggestion = async ({
  suggestionId,
  deckId,
  deckName,
}: AcceptSuggestionParams): Promise<AcceptSuggestionResponse> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/suggestions/${suggestionId}/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ deckId, deckName }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to accept suggestion');
  }

  return response.json();
};

export const useAcceptSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptSuggestion,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['chatInfo', variables.chatId] });
      await queryClient.cancelQueries({ queryKey: ['pendingSuggestions', variables.chatId] });

      // Snapshot the previous values
      const previousChatInfo = queryClient.getQueryData(['chatInfo', variables.chatId]);
      const previousPendingSuggestions = queryClient.getQueryData<Suggestion[]>([
        'pendingSuggestions',
        variables.chatId,
      ]);

      // Optimistically update chatInfo
      queryClient.setQueryData(['chatInfo', variables.chatId], (old: any) => {
        const updatedSuggestions = old.suggestions.map((s: Suggestion) =>
          s.id === variables.suggestionId ? { ...s, status: 'accepted' } : s
        );
        return { ...old, suggestions: updatedSuggestions };
      });

      // Optimistically update pendingSuggestions
      queryClient.setQueryData<Suggestion[]>(['pendingSuggestions', variables.chatId], (old = []) => {
        return old.filter((suggestion) => suggestion.id !== variables.suggestionId);
      });

      // Return a context object with the snapshotted values
      return { previousChatInfo, previousPendingSuggestions };
    },
    onError: (_, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['chatInfo', variables.chatId], context?.previousChatInfo);
      queryClient.setQueryData(['pendingSuggestions', variables.chatId], context?.previousPendingSuggestions);
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success:
      queryClient.invalidateQueries({ queryKey: ['chatInfo', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['pendingSuggestions', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      queryClient.invalidateQueries({ queryKey: ['cards', variables.deckId] });
      queryClient.invalidateQueries({ queryKey: ['decks', 'dueCounts'] });
    },
  });
};
