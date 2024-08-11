import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
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
    onMutate: async (_) => {
      await queryClient.cancelQueries({ queryKey: ['decks'] });

      const previousDecks = queryClient.getQueryData<Deck[]>(['decks']);
      // Add optimistic update maybe?
      return { previousDecks };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData(['decks'], context?.previousDecks);
      console.error('Failed to create deck:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });
};
