import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';

interface Deck {
  id: string;
  name: string;
  // Add other deck properties as needed
}

const fetchDeck = async (deckId: string): Promise<Deck> => {
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('id', deckId)
    .single();

  if (error) throw error;
  return data;
};

export const useDeck = (deckId: string | undefined) => {
  return useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => fetchDeck(deckId!),
    enabled: !!deckId,
  });
};
