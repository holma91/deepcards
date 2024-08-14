import { Database } from './database.types';

export type Chat = Database['public']['Tables']['chats']['Row'];
export type Card = Database['public']['Tables']['cards']['Row'];
export type Deck = Database['public']['Tables']['decks']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];
export type Suggestion = Database['public']['Tables']['suggestions']['Row'];
export type SuggestionStatus = Database['public']['Enums']['suggestion_status'];
export type Profile = Database['public']['Tables']['profiles']['Row'];

export type ChatResponse = Chat & {
  card: Card | null;
  messages: Message[];
  suggestions: Suggestion[];
};

export type TimelineItem = (Message & { type: 'message' }) | (Suggestion & { type: 'suggestion' });

export type CardWithDecks = Database['public']['Tables']['cards']['Row'] & {
  decks: Array<{
    id: string;
    name: string;
  }>;
};
