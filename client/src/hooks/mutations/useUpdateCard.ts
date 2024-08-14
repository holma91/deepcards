// src/hooks/mutations/useUpdateCard.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { Card } from '../../types';
import { API_BASE_URL } from '../../config';

interface UpdateCardParams {
  id: string;
  front: string;
  back: string;
  deckId?: string;
}

const updateCard = async ({ id, front, back }: UpdateCardParams): Promise<Card> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/cards/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ front, back }),
  });

  if (!response.ok) throw new Error('Failed to update card');
  return response.json();
};

export const useUpdateCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCard,
    onMutate: async (updatedCard) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cards'] });
      await queryClient.cancelQueries({ queryKey: ['cards', 'due'] });
      if (updatedCard.deckId) {
        await queryClient.cancelQueries({ queryKey: ['cards', updatedCard.deckId] });
        await queryClient.cancelQueries({ queryKey: ['cards', 'due', updatedCard.deckId] });
      }

      // Snapshot the previous values
      const previousCards = queryClient.getQueryData<Card[]>(['cards']);
      const previousAllDueCards = queryClient.getQueryData<Card[]>(['cards', 'due']);
      const previousDeckCards = updatedCard.deckId
        ? queryClient.getQueryData<Card[]>(['cards', updatedCard.deckId])
        : undefined;
      const previousDeckDueCards = updatedCard.deckId
        ? queryClient.getQueryData<Card[]>(['cards', 'due', updatedCard.deckId])
        : undefined;

      // Optimistically update to the new value
      const updateCards = (oldCards: Card[] = []) =>
        oldCards.map((card) =>
          card.id === updatedCard.id ? { ...card, front: updatedCard.front, back: updatedCard.back } : card
        );

      queryClient.setQueryData<Card[]>(['cards'], updateCards);
      queryClient.setQueryData<Card[]>(['cards', 'due'], updateCards);
      if (updatedCard.deckId) {
        queryClient.setQueryData<Card[]>(['cards', updatedCard.deckId], updateCards);
        queryClient.setQueryData<Card[]>(['cards', 'due', updatedCard.deckId], updateCards);
      }

      // Return a context object with the snapshotted values
      return { previousCards, previousAllDueCards, previousDeckCards, previousDeckDueCards };
    },
    onError: (_, updatedCard, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['cards'], context?.previousCards);
      queryClient.setQueryData(['cards', 'due'], context?.previousAllDueCards);
      if (updatedCard.deckId) {
        queryClient.setQueryData(['cards', updatedCard.deckId], context?.previousDeckCards);
        queryClient.setQueryData(['cards', 'due', updatedCard.deckId], context?.previousDeckDueCards);
      }
    },
    onSettled: (_, __, updatedCard) => {
      // Always refetch after error or success to ensure we have the correct data
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['cards', 'due'] });
      if (updatedCard.deckId) {
        queryClient.invalidateQueries({ queryKey: ['cards', updatedCard.deckId] });
        queryClient.invalidateQueries({ queryKey: ['cards', 'due', updatedCard.deckId] });
      }
    },
  });
};
