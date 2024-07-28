import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabaseClient';
import { Deck } from '../../types';
import { API_BASE_URL } from '../../config';
import { DeckDueCount } from '../useDecksDueCounts';

interface DeleteDeckParams {
  deckId: string;
}

const deleteDeck = async ({ deckId }: DeleteDeckParams): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/decks/${deckId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to delete deck');
  }
};

export const useDeleteDeck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDeck,
    onMutate: async ({ deckId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['decks'] });
      await queryClient.cancelQueries({ queryKey: ['decks', 'dueCounts'] });

      // Snapshot the previous values
      const previousDecks = queryClient.getQueryData<Deck[]>(['decks']);
      const previousDueCounts = queryClient.getQueryData<DeckDueCount[]>(['decks', 'dueCounts']);

      // Optimistically update by removing the deck
      queryClient.setQueryData<Deck[]>(['decks'], (old) => (old ? old.filter((deck) => deck.id !== deckId) : []));

      queryClient.setQueryData<DeckDueCount[]>(['decks', 'dueCounts'], (old) =>
        old ? old.filter((deck) => deck.id !== deckId) : []
      );

      // Return a context with the snapshotted values
      return { previousDecks, previousDueCounts };
    },
    onError: (_, __, context) => {
      // If the mutation fails, use the context to roll back
      if (context?.previousDecks) {
        queryClient.setQueryData(['decks'], context.previousDecks);
      }
      if (context?.previousDueCounts) {
        queryClient.setQueryData(['decks', 'dueCounts'], context.previousDueCounts);
      }
    },
    onSettled: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      queryClient.invalidateQueries({ queryKey: ['decks', 'dueCounts'] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['cards', 'due'] });
    },
  });
};
