// src/hooks/useDeleteCard.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabaseClient';
import { Card } from '../../types';
import { API_BASE_URL } from '../../config';
import { DeckDueCount } from '../useDecksDueCounts';

interface DeleteCardParams {
  cardId: string;
  deckId: string;
}

const deleteCard = async ({ cardId }: DeleteCardParams): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/cards/${cardId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete card');
  }
};

export const useDeleteCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCard,
    onMutate: async ({ cardId, deckId }: DeleteCardParams) => {
      await queryClient.cancelQueries({ queryKey: ['cards', deckId] });
      await queryClient.cancelQueries({ queryKey: ['decks', 'dueCounts'] });

      const previousCards = queryClient.getQueryData<Card[]>(['cards', deckId]);
      const previousDueCounts = queryClient.getQueryData<DeckDueCount[]>(['decks', 'dueCounts']);

      queryClient.setQueryData<Card[]>(['cards', deckId], (old = []) => old.filter((card) => card.id !== cardId));

      const cardToDelete = previousCards?.find((card) => card.id === cardId);
      if (cardToDelete && new Date(cardToDelete.nextReview) <= new Date()) {
        queryClient.setQueryData<DeckDueCount[]>(['decks', 'dueCounts'], (old = []) =>
          old.map((deck) => (deck.id === deckId ? { ...deck, dueCount: Math.max(0, deck.dueCount - 1) } : deck))
        );
      }

      return { previousCards, previousDueCounts, deckId };
    },
    onError: (_, __, context) => {
      if (context?.previousCards) {
        queryClient.setQueryData(['cards', context.deckId], context.previousCards);
      }
      if (context?.previousDueCounts) {
        queryClient.setQueryData(['decks', 'dueCounts'], context.previousDueCounts);
      }
    },
    onSettled: (_, __, { deckId }) => {
      queryClient.invalidateQueries({ queryKey: ['cards', deckId] });
      queryClient.invalidateQueries({ queryKey: ['decks', 'dueCounts'] });
      queryClient.invalidateQueries({ queryKey: ['cards', 'due'] });
      queryClient.invalidateQueries({ queryKey: ['cards', 'due', deckId] });
    },
  });
};
