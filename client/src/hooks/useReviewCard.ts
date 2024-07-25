// src/hooks/useReviewCard.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { Card } from '../types';

const reviewCard = async (cardId: string, grade: number): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session');
  }

  const response = await fetch(
    `http://localhost:3001/api/cards/${cardId}/review`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ grade }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to review card');
  }
};

export const useReviewCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, grade }: { cardId: string; grade: number }) =>
      reviewCard(cardId, grade),
    onMutate: async ({ cardId, grade }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['cards'] });

      // Snapshot the previous value
      const previousCards = queryClient.getQueryData<Card[]>(['cards']);

      // Optimistically update to the new value
      if (previousCards) {
        queryClient.setQueryData<Card[]>(['cards'], (old) =>
          old ? old.filter((card) => card.id !== cardId) : []
        );
      }

      // Return a context object with the snapshotted value
      return { previousCards };
    },
    onError: (err, newTodo, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousCards) {
        queryClient.setQueryData<Card[]>(['cards'], context.previousCards);
      }
    },
    onSettled: () => {
      // Always refetch after error or success:
      queryClient.invalidateQueries({ queryKey: ['cards'] });
    },
  });
};
