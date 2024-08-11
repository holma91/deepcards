import { Database } from './supabase/database.types';

export type Chat = Database['public']['Tables']['chats']['Row'];
export type Card = Database['public']['Tables']['cards']['Row'];
export type Deck = Database['public']['Tables']['decks']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Suggestion = Database['public']['Tables']['suggestions']['Row'];
export type SuggestionStatus = Database['public']['Enums']['suggestion_status'];

export type ChatResponse = Chat & {
  card: Card | null;
  messages: Message[];
  suggestions: Suggestion[];
};

export type TimelineItem = (Message & { type: 'message' }) | (Suggestion & { type: 'suggestion' });

// export type CardWithDecks = Database['public']['Tables']['cards']['Row'] & {
//   decks: Database['public']['Tables']['decks']['Row'][];
// };

// export type CardWithDecks = Database['public']['Tables']['cards']['Row'] & {
//   card_decks: Database['public']['Tables']['decks']['Row'][];
// };

// export type CardWithDecks = Database['public']['Tables']['cards']['Row'] & {
//   card_decks: Array<{
//     id: string; // Assuming deck_id is a string (UUID)
//     name: string;
//   }>;
// };

export type CardWithDecks = Database['public']['Tables']['cards']['Row'] & {
  decks: Array<{
    id: string;
    name: string;
  }>;
};
