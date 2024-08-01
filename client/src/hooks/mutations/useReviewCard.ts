import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { Card } from '../../types';
import { DeckDueCount } from '../useDecksDueCounts';
import { API_BASE_URL } from '../../config';

const reviewCard = async (cardId: string, grade: number): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No active session');
  }

  const response = await fetch(`${API_BASE_URL}/cards/${cardId}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ grade }),
  });

  if (!response.ok) {
    throw new Error('Failed to review card');
  }
};

export const useReviewCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, grade }: { cardId: string; grade: number; deckIds: string[] }) => reviewCard(cardId, grade),
    onMutate: async ({ cardId, deckIds }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cards', 'due'] });
      await queryClient.cancelQueries({ queryKey: ['decks', 'dueCounts'] });
      for (const deckId of deckIds) {
        await queryClient.cancelQueries({ queryKey: ['cards', 'due', deckId] });
      }

      // Snapshot the previous values
      const previousDueCards = queryClient.getQueryData<Card[]>(['cards', 'due']);
      const previousDeckDueCards = deckIds.map((deckId) => ({
        deckId,
        cards: queryClient.getQueryData<Card[]>(['cards', 'due', deckId]),
      }));
      const previousDueCounts = queryClient.getQueryData<DeckDueCount[]>(['decks', 'dueCounts']);

      // Update due cards
      if (previousDueCards) {
        queryClient.setQueryData<Card[]>(['cards', 'due'], (old) =>
          old ? old.filter((card) => card.id !== cardId) : []
        );
      }

      // Update deck-specific due cards
      for (const deckId of deckIds) {
        queryClient.setQueryData<Card[]>(['cards', 'due', deckId], (old) =>
          old ? old.filter((card) => card.id !== cardId) : []
        );
      }

      // Update due counts
      if (previousDueCounts) {
        queryClient.setQueryData<DeckDueCount[]>(['decks', 'dueCounts'], (old) =>
          old
            ? old.map((deck) =>
                deckIds.includes(deck.id) ? { ...deck, dueCount: Math.max(0, deck.dueCount - 1) } : deck
              )
            : []
        );
      }

      return {
        previousDueCards,
        previousDeckDueCards,
        previousDueCounts,
        deckIds,
      };
    },
    onError: (_, __, context) => {
      // If the mutation fails, roll back to the previous values
      if (context?.previousDueCards) {
        queryClient.setQueryData(['cards', 'due'], context.previousDueCards);
      }
      if (context?.previousDeckDueCards) {
        for (const { deckId, cards } of context.previousDeckDueCards) {
          queryClient.setQueryData(['cards', 'due', deckId], cards);
        }
      }
      if (context?.previousDueCounts) {
        queryClient.setQueryData(['decks', 'dueCounts'], context.previousDueCounts);
      }
    },
    onSettled: (_, __, { deckIds }) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['cards', 'due'] });
      queryClient.invalidateQueries({ queryKey: ['decks', 'dueCounts'] });
      for (const deckId of deckIds) {
        queryClient.invalidateQueries({ queryKey: ['cards', 'due', deckId] });
        queryClient.invalidateQueries({ queryKey: ['cards', deckId] });
      }
    },
  });
};
