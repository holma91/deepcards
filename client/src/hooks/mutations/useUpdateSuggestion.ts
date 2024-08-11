// src/hooks/mutations/useUpdateSuggestion.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../config';
import { SuggestionStatus } from '../../types';
import { supabase } from '../../utils/supabaseClient';

interface UpdateSuggestionParams {
  suggestionId: string;
  status: SuggestionStatus;
}

const updateSuggestion = async ({ suggestionId, status }: UpdateSuggestionParams) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');
  const response = await fetch(`${API_BASE_URL}/suggestions/${suggestionId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('Failed to update suggestion');
  }

  return response.json();
};

export const useUpdateSuggestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSuggestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatInfo'] });
    },
  });
};
