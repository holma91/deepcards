import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../config';
import { Suggestion, SuggestionStatus } from '../../types';
import { supabase } from '../../clients/supabaseClient';

interface UpdateSuggestionParams {
  suggestionId: string;
  chatId: string;
  status?: SuggestionStatus;
  modified_front?: string;
  modified_back?: string;
}

const updateSuggestion = async ({
  suggestionId,
  status,
  modified_front,
  modified_back,
}: UpdateSuggestionParams): Promise<Suggestion> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/suggestions/${suggestionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ status, modified_front, modified_back }),
  });

  if (!response.ok) {
    throw new Error('Failed to update suggestion');
  }

  return response.json();
};

export const useUpdateSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSuggestion,
    onMutate: async ({ suggestionId, chatId, status, modified_front, modified_back }) => {
      await queryClient.cancelQueries({ queryKey: ['pendingSuggestions', chatId] });

      const previousSuggestions = queryClient.getQueryData<Suggestion[]>(['pendingSuggestions', chatId]);

      queryClient.setQueryData<Suggestion[]>(['pendingSuggestions', chatId], (old = []) => {
        if (status === 'rejected') {
          return old.filter((suggestion) => suggestion.id !== suggestionId);
        } else {
          return old.map((suggestion) => {
            if (suggestion.id === suggestionId) {
              return {
                ...suggestion,
                status: status ?? suggestion.status,
                modified_front: modified_front ?? suggestion.modified_front,
                modified_back: modified_back ?? suggestion.modified_back,
              };
            }
            return suggestion;
          });
        }
      });

      return { previousSuggestions };
    },
    onError: (_, { chatId }, context) => {
      queryClient.setQueryData(['pendingSuggestions', chatId], context?.previousSuggestions);
    },
    onSettled: (_, __, { chatId }) => {
      queryClient.invalidateQueries({ queryKey: ['pendingSuggestions', chatId] });
      queryClient.invalidateQueries({ queryKey: ['chatInfo', chatId] });
    },
  });
};
