import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabaseClient';
import { Card } from '../../types';
import { DeckDueCount } from '../useDecksDueCounts';

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
    mutationFn: ({
      cardId,
      grade,
    }: {
      cardId: string;
      grade: number;
      deckId: string;
    }) => reviewCard(cardId, grade),
    onMutate: async ({ cardId, deckId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cards', 'due'] });
      await queryClient.cancelQueries({ queryKey: ['decks', 'dueCounts'] });
      await queryClient.cancelQueries({ queryKey: ['cards', 'due', deckId] });

      // Snapshot the previous values
      const previousDueCards = queryClient.getQueryData<Card[]>([
        'cards',
        'due',
      ]);
      const previousDeckDueCards = queryClient.getQueryData<Card[]>([
        'cards',
        'due',
        deckId,
      ]);
      const previousDueCounts = queryClient.getQueryData<DeckDueCount[]>([
        'decks',
        'dueCounts',
      ]);

      // Optimistically update due cards
      if (previousDueCards) {
        queryClient.setQueryData<Card[]>(['cards', 'due'], (old) =>
          old ? old.filter((card) => card.id !== cardId) : []
        );
      }

      // Optimistically update deck-specific due cards
      if (previousDeckDueCards) {
        queryClient.setQueryData<Card[]>(['cards', 'due', deckId], (old) =>
          old ? old.filter((card) => card.id !== cardId) : []
        );
      }

      // Optimistically update deck due counts
      if (previousDueCounts) {
        queryClient.setQueryData<DeckDueCount[]>(
          ['decks', 'dueCounts'],
          (old) =>
            old
              ? old.map((deck) =>
                  deck.id === deckId
                    ? { ...deck, dueCount: Math.max(0, deck.dueCount - 1) }
                    : deck
                )
              : []
        );
      }

      // Return a context with the snapshotted values
      return {
        previousDueCards,
        previousDeckDueCards,
        previousDueCounts,
        deckId,
      };
    },
    onError: (_, __, context) => {
      // If the mutation fails, roll back to the previous values
      if (context?.previousDueCards) {
        queryClient.setQueryData(['cards', 'due'], context.previousDueCards);
      }
      if (context?.previousDeckDueCards && context?.deckId) {
        queryClient.setQueryData(
          ['cards', 'due', context.deckId],
          context.previousDeckDueCards
        );
      }
      if (context?.previousDueCounts) {
        queryClient.setQueryData(
          ['decks', 'dueCounts'],
          context.previousDueCounts
        );
      }
    },
    onSettled: (_, __, { deckId }) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['cards', 'due'] });
      queryClient.invalidateQueries({ queryKey: ['decks', 'dueCounts'] });
      queryClient.invalidateQueries({ queryKey: ['cards', 'due', deckId] });
      queryClient.invalidateQueries({ queryKey: ['cards', deckId] });
    },
  });
};
