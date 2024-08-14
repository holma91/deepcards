import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { API_BASE_URL } from '../../config';
import { Profile } from '../../types';

type UpdateProfileParams = Partial<Omit<Profile, 'id' | 'updated_at'>>;

interface UpdateProfileContext {
  previousProfile: Profile | undefined;
}

const updateProfile = async (params: UpdateProfileParams): Promise<Profile> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/profiles`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) throw new Error('Failed to update profile');
  return response.json();
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation<Profile, Error, UpdateProfileParams, UpdateProfileContext>({
    mutationFn: updateProfile,
    onMutate: async (updatedProfile) => {
      await queryClient.cancelQueries({ queryKey: ['profile'] });

      const previousProfile = queryClient.getQueryData<Profile>(['profile']);

      queryClient.setQueryData<Profile>(['profile'], (old) => {
        if (!old) return old;
        return {
          ...old,
          ...updatedProfile,
        };
      });

      return { previousProfile };
    },
    onError: (_, __, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(['profile'], context.previousProfile);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};
