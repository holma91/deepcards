// src/hooks/useDeleteCard.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';

const deleteCard = async ({
  cardId,
}: {
  cardId: string;
  deckId: string;
}): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`http://localhost:3001/api/cards/${cardId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete card');
  }
};

export const useDeleteCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCard,
    onMutate: async ({ cardId, deckId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cards', deckId] });

      // Snapshot the previous value
      const previousCards = queryClient.getQueryData<any[]>(['cards', deckId]);

      // Optimistically update to the new value
      queryClient.setQueryData<any[]>(['cards', deckId], (old) => {
        return old ? old.filter((card) => card.id !== cardId) : [];
      });

      // Return a context object with the snapshotted value
      return { previousCards };
    },
    onError: (_, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        ['cards', variables.deckId],
        context?.previousCards
      );
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success:
      queryClient.invalidateQueries({ queryKey: ['cards', variables.deckId] });
    },
  });
};
