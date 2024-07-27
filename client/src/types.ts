export interface Card {
  id: string;
  deckId: string;
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
