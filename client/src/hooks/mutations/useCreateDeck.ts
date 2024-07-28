import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabaseClient';
import { Deck } from '../../types';
import { API_BASE_URL } from '../../config';

interface CreateDeckVariables {
  id: string;
  name: string;
}

const createDeck = async ({ id, name }: CreateDeckVariables): Promise<Deck> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/decks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ id, name }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create deck');
  }

  return response.json();
};

export const useCreateDeck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDeck,
    onMutate: async (newDeck) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['decks'] });

      // Snapshot the previous value
      const previousDecks = queryClient.getQueryData<Deck[]>(['decks']);

      // Optimistically update to the new value
      queryClient.setQueryData<Deck[]>(['decks'], (old = []) => [...old, { ...newDeck, cardCount: 0 }]);

      // Return a context object with the snapshotted value
      return { previousDecks };
    },
    onError: (err, _, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      queryClient.setQueryData(['decks'], context?.previousDecks);

      // You might want to add some error reporting here
      console.error('Failed to create deck:', err);
    },
    onSettled: () => {
      // Always refetch after error or success:
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
};
