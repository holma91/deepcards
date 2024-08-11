// src/hooks/useCreateCard.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { Card } from '../../types';
import { API_BASE_URL } from '../../config';
import { DeckDueCount } from '../useDecksDueCounts';

interface CreateCardParams {
  front: string;
  back: string;
  deckId: string;
  deckName: string;
  chatId?: string;
  suggestionId?: string;
}

const createCard = async ({ front, back, deckId, chatId, suggestionId }: CreateCardParams): Promise<Card> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ front, back, deckId, chatId, suggestionId }),
  });

  if (!response.ok) throw new Error('Failed to create card');
  return response.json();
};

export const useCreateCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCard,
    onMutate: async (newCard) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['cards', newCard.deckId] });
      await queryClient.cancelQueries({ queryKey: ['decks', 'dueCounts'] });

      // Snapshot the previous values
      const previousCards = queryClient.getQueryData<Card[]>(['cards', newCard.deckId]);
      const previousDueCounts = queryClient.getQueryData<DeckDueCount[]>(['decks', 'dueCounts']);

      // Should we ptimistically update cards?

      // Optimistically update due counts
      queryClient.setQueryData<DeckDueCount[]>(['decks', 'dueCounts'], (old = []) =>
        old.map((deck) => (deck.id === newCard.deckId ? { ...deck, due_count: deck.due_count + 1 } : deck))
      );

      return { previousCards, previousDueCounts };
    },
    onError: (_, newCard, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['cards', newCard.deckId], context?.previousCards);
      queryClient.setQueryData(['decks', 'dueCounts'], context?.previousDueCounts);
    },
    onSettled: (_, __, newCard) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['cards', newCard.deckId] });
      queryClient.invalidateQueries({ queryKey: ['decks', 'dueCounts'] });
      queryClient.invalidateQueries({ queryKey: ['cards', 'due'] });
      queryClient.invalidateQueries({ queryKey: ['cards', 'due', newCard.deckId] });
      queryClient.invalidateQueries({ queryKey: ['chatInfo', newCard.chatId] });
    },
  });
};
