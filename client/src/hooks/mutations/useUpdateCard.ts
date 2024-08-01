// src/hooks/useUpdateCard.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { Card } from '../../types';
import { API_BASE_URL } from '../../config';

interface UpdateCardParams {
  id: string;
  front: string;
  back: string;
  deckId: string;
}

const updateCard = async ({ id, front, back }: UpdateCardParams): Promise<Card> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/cards/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ front, back }),
  });

  console.log(response);

  if (!response.ok) throw new Error('Failed to update card');
  return response.json();
};

export const useUpdateCard = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCard,
    onMutate: async (updatedCard) => {
      await queryClient.cancelQueries({ queryKey: ['cards', updatedCard.deckId] });

      const previousCards = queryClient.getQueryData<Card[]>(['cards', updatedCard.deckId]);

      queryClient.setQueryData<Card[]>(['cards', updatedCard.deckId], (old = []) =>
        old.map((card) =>
          card.id === updatedCard.id ? { ...card, front: updatedCard.front, back: updatedCard.back } : card
        )
      );

      return { previousCards };
    },
    onError: (_, updatedCard, context) => {
      queryClient.setQueryData(['cards', updatedCard.deckId], context?.previousCards);
    },
    onSettled: (_, __, updatedCard) => {
      queryClient.invalidateQueries({ queryKey: ['cards', updatedCard.deckId] });
    },
  });
};
