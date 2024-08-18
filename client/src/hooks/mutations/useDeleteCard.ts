import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../clients/supabaseClient';
import { Card } from '../../types';
import { API_BASE_URL } from '../../config';
import { DeckDueCount } from '../queries/useDecksDueCounts';

interface DeleteCardParams {
  cardId: string;
  deckId?: string;
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
      // Cancel queries
      await queryClient.cancelQueries({ queryKey: ['cards'] });
      if (deckId) {
        await queryClient.cancelQueries({ queryKey: ['cards', deckId] });
      }
      await queryClient.cancelQueries({ queryKey: ['decks', 'dueCounts'] });

      // Snapshot previous values
      const previousAllCards = queryClient.getQueryData<Card[]>(['cards']);
      const previousDeckCards = deckId ? queryClient.getQueryData<Card[]>(['cards', deckId]) : undefined;
      const previousDueCounts = queryClient.getQueryData<DeckDueCount[]>(['decks', 'dueCounts']);

      // Optimistically update
      queryClient.setQueryData<Card[]>(['cards'], (old = []) => old.filter((card) => card.id !== cardId));

      if (deckId) {
        queryClient.setQueryData<Card[]>(['cards', deckId], (old = []) => old.filter((card) => card.id !== cardId));
      }

      const cardToDelete = previousAllCards?.find((card) => card.id === cardId);
      if (cardToDelete && new Date(cardToDelete.next_review) <= new Date()) {
        queryClient.setQueryData<DeckDueCount[]>(['decks', 'dueCounts'], (old = []) =>
          old.map((deck) => (deck.id === deckId ? { ...deck, due_count: Math.max(0, deck.due_count - 1) } : deck))
        );
      }

      return { previousAllCards, previousDeckCards, previousDueCounts, deckId };
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousAllCards) {
        queryClient.setQueryData(['cards'], context.previousAllCards);
      }
      if (context?.deckId && context?.previousDeckCards) {
        queryClient.setQueryData(['cards', context.deckId], context.previousDeckCards);
      }
      if (context?.previousDueCounts) {
        queryClient.setQueryData(['decks', 'dueCounts'], context.previousDueCounts);
      }
    },
    onSettled: (_, __, { deckId }) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      if (deckId) {
        queryClient.invalidateQueries({ queryKey: ['cards', deckId] });
        queryClient.invalidateQueries({ queryKey: ['cards', 'due', deckId] });
      }
      queryClient.invalidateQueries({ queryKey: ['decks', 'dueCounts'] });
      queryClient.invalidateQueries({ queryKey: ['cards', 'due'] });
    },
  });
};
