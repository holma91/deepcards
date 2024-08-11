import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { API_BASE_URL } from '../../config';
import { Suggestion } from '../../types'; // Adjust the import path as needed

interface GenerateFlashcardsParams {
  chatId: string;
}

interface GenerateFlashcardsResponse {
  suggestions: Suggestion[];
}

const generateFlashcards = async ({ chatId }: GenerateFlashcardsParams): Promise<GenerateFlashcardsResponse> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/chat/${chatId}/cards`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to generate flashcards');
  }
  return response.json();
};

export const useGenerateFlashcards = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateFlashcards,
    onSuccess: (_, variables) => {
      // Invalidate and refetch chatInfo query
      queryClient.invalidateQueries({ queryKey: ['chatInfo', variables.chatId] });
    },
  });
};
