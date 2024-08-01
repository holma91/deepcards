// src/hooks/useStats.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../utils/supabaseClient';
import { API_BASE_URL } from '../config';

interface Stats {
  today: {
    reviewed: number;
    added: number;
  };
  allTime: {
    reviewed: number;
    added: number;
  };
}

const fetchStats = async (): Promise<Stats> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/cards/stats`, {
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }

  return response.json();
};

export const useStats = () => {
  return useQuery<Stats, Error>({
    queryKey: ['stats'],
    queryFn: fetchStats,
  });
};
