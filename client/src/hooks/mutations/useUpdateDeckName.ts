// src/hooks/mutations/useUpdateDeckName.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabaseClient';
import { API_BASE_URL } from '../../config';
import { DeckDueCount } from '../useDecksDueCounts';

interface UpdateDeckNameParams {
  deckId: string;
  newName: string;
}

const updateDeckName = async ({ deckId, newName }: UpdateDeckNameParams): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/decks/${deckId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ name: newName }),
  });

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
      // Cancel all related queries
      await queryClient.cancelQueries({ queryKey: ['deck', deckId] });
      await queryClient.cancelQueries({ queryKey: ['decks'] });
      await queryClient.cancelQueries({ queryKey: ['decks', 'dueCounts'] });

      // Snapshot previous values
      const previousDeck = queryClient.getQueryData<any>(['deck', deckId]);
      const previousDecks = queryClient.getQueryData<any[]>(['decks']);
      const previousDueCounts = queryClient.getQueryData<DeckDueCount[]>(['decks', 'dueCounts']);

      // Update single deck
      queryClient.setQueryData<any>(['deck', deckId], (old: any) => (old ? { ...old, name: newName } : null));

      // Update decks list
      queryClient.setQueryData<any[]>(['decks'], (old) =>
        old ? old.map((deck) => (deck.id === deckId ? { ...deck, name: newName } : deck)) : []
      );

      // Update due counts
      queryClient.setQueryData<DeckDueCount[]>(['decks', 'dueCounts'], (old) =>
        old ? old.map((deck) => (deck.id === deckId ? { ...deck, name: newName } : deck)) : []
      );

      return { previousDeck, previousDecks, previousDueCounts };
    },
    onError: (_, variables, context) => {
      // Revert all optimistic updates
      queryClient.setQueryData(['deck', variables.deckId], context?.previousDeck);
      queryClient.setQueryData(['decks'], context?.previousDecks);
      queryClient.setQueryData(['decks', 'dueCounts'], context?.previousDueCounts);
    },
    onSettled: (_, __, variables) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ['deck', variables.deckId] });
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      queryClient.invalidateQueries({ queryKey: ['decks', 'dueCounts'] });
    },
  });
};
