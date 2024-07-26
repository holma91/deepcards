// src/hooks/useCreateCard.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabaseClient';
import { Card } from '../useCards';

interface CreateCardParams {
  front: string;
  back: string;
  deckId: string;
}

const createCard = async ({
  front,
  back,
  deckId,
}: CreateCardParams): Promise<Card> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch('http://localhost:3001/api/cards', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ front, back, deckId }),
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

      // Snapshot the previous value
      const previousCards = queryClient.getQueryData<Card[]>([
        'cards',
        newCard.deckId,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData<Card[]>(
        ['cards', newCard.deckId],
        (old = []) => [
          ...old,
          {
            id: 'temp-id-' + Date.now(), // temporary ID
            front: newCard.front,
            back: newCard.back,
            created_at: new Date().toISOString(),
          },
        ]
      );

      // Return a context object with the snapshotted value
      return { previousCards };
    },
    onError: (_, newCard, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(
        ['cards', newCard.deckId],
        context?.previousCards
      );
    },
    onSettled: (_, __, newCard) => {
      // Always refetch after error or success:
      queryClient.invalidateQueries({ queryKey: ['cards', newCard.deckId] });
    },
  });
};
