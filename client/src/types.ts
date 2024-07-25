export interface Card {
  id: string;
  user_id: string;
  front: string;
  back: string;
  stage: number;
  ease_factor: number;
  interval: number;
  next_review: string;
  created_at: string;
}

export interface Deck {
  id: string;
  name: string;
}

export interface DeckWithCards extends Deck {
  cards: Card[];
}
