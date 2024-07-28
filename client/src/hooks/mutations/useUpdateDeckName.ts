// src/hooks/mutations/useUpdateDeckName.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabaseClient';

interface UpdateDeckNameParams {
  deckId: string;
  newName: string;
}

const updateDeckName = async ({
  deckId,
  newName,
}: UpdateDeckNameParams): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(
    `http://localhost:3001/api/cards/decks/${deckId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ name: newName }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to update deck name');
  }
};

export const useUpdateDeckName = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDeckName,
    onMutate: async ({ deckId, newName }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['deck', deckId] });

      // Snapshot the previous value
      const previousDeck = queryClient.getQueryData<any>(['deck', deckId]);

      // Optimistically update to the new value
      queryClient.setQueryData<any>(['deck', deckId], (old: any) => {
        return old ? { ...old, name: newName } : null;
      });

      // Return a context object with the snapshotted value
      return { previousDeck };
    },
    onError: (_, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        ['deck', variables.deckId],
        context?.previousDeck
      );
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success:
      queryClient.invalidateQueries({ queryKey: ['deck', variables.deckId] });
      // Invalidate the decks list query
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
};
