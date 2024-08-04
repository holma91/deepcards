export interface Card {
  id: string;
  decks: { id: string; name: string }[];
  userId: string;
  front: string;
  back: string;
  stage: number;
  easeFactor: number;
  interval: number;
  nextReview: string;
  createdAt: string;
}

export interface Deck {
  id: string;
  name: string;
}

export interface DeckWithCards extends Deck {
  cards: Card[];
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
