export interface Card {
  id: string;
  front: string;
  back: string;
}

export interface Deck {
  id: string;
  name: string;
  cards: Card[];
}
