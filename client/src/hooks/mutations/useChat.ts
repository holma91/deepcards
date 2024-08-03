import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../utils/supabaseClient';
import { API_BASE_URL } from '../../config';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatParams {
  cardContent?: string;
  messages: Message[];
}

interface ChatResponse {
  response: string;
}

const chatWithAI = async ({ cardContent, messages }: ChatParams): Promise<ChatResponse> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('No active session');

  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ cardContent, messages }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to get AI response');
  }
  return response.json();
};

export const useChat = () => {
  return useMutation({
    mutationFn: chatWithAI,
  });
};
