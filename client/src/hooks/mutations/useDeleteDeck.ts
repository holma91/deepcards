import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../supabaseClient';

interface DeleteDeckParams {
  deckId: string;
}

const deleteDeck = async ({ deckId }: DeleteDeckParams): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(
    `http://localhost:3001/api/cards/decks/${deckId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    }
  );

  if (!response.ok) throw new Error('Failed to delete deck');
};

export const useDeleteDeck = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteDeck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      queryClient.invalidateQueries({ queryKey: ['decks', 'dueCounts'] });
    },
  });
};
