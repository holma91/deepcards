import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';
import { Deck } from '../types';

interface CreateDeckVariables {
  id: string;
  name: string;
}

const createDeck = async ({ id, name }: CreateDeckVariables): Promise<Deck> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch('http://localhost:3001/api/cards/decks', {
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
      await queryClient.cancelQueries({ queryKey: ['decks'] });

      const previousDecks = queryClient.getQueryData<Deck[]>(['decks']);

      queryClient.setQueryData<Deck[]>(['decks'], (old = []) => [
        ...old,
        newDeck,
      ]);

      return { previousDecks };
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(['decks'], context?.previousDecks);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
};
