// src/hooks/mutations/useAcceptSuggestion.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { API_BASE_URL } from '../../config';
import { Suggestion, Card } from '../../types';

interface AcceptSuggestionParams {
  suggestionId: string;
  deckId: string;
  deckName: string;
  chatId: string; // for invalidating the chat info query
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

      // Snapshot the previous value
      const previousChatInfo = queryClient.getQueryData(['chatInfo', variables.chatId]);

      // Optimistically update to the new value
      queryClient.setQueryData(['chatInfo', variables.chatId], (old: any) => {
        const updatedSuggestions = old.suggestions.map((s: Suggestion) =>
          s.id === variables.suggestionId ? { ...s, status: 'accepted' } : s
        );
        return { ...old, suggestions: updatedSuggestions };
      });

      // Return a context object with the snapshotted value
      return { previousChatInfo };
    },
    onError: (_, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['chatInfo', variables.chatId], context?.previousChatInfo);
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success:
      queryClient.invalidateQueries({ queryKey: ['chatInfo', variables.chatId] });
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
};
