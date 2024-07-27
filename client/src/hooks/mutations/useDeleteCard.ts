// src/hooks/useDeleteCard.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabaseClient';

interface DeleteCardParams {
  cardId: string;
  deckId?: string; // Make deckId optional
}

const deleteCard = async ({ cardId }: DeleteCardParams): Promise<void> => {
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
    onMutate: async ({ cardId, deckId }: DeleteCardParams) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: deckId ? ['cards', deckId] : ['cards'],
      });

      // Snapshot the previous value
      const previousCards = queryClient.getQueryData<any[]>(
        deckId ? ['cards', deckId] : ['cards']
      );

      // Optimistically update to the new value
      queryClient.setQueryData<any[]>(
        deckId ? ['cards', deckId] : ['cards'],
        (old) => {
          return old ? old.filter((card) => card.id !== cardId) : [];
        }
      );

      // Return a context object with the snapshotted value
      return { previousCards, deckId };
    },
    onError: (_, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        context?.deckId ? ['cards', context.deckId] : ['cards'],
        context?.previousCards
      );
    },
    onSettled: (_, __, variables, context) => {
      // Always refetch after error or success:
      if (context?.deckId) {
        queryClient.invalidateQueries({ queryKey: ['cards', context.deckId] });
      }
      // Always invalidate the all-cards query
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      // Invalidate deck due counts
      queryClient.invalidateQueries({ queryKey: ['decks', 'dueCounts'] });
    },
  });
};
