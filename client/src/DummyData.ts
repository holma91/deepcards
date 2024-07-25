import { Deck } from './types';

export const dummyDeck: Deck = {
  id: '1',
  name: 'Sample Deck',
  cards: [
    { id: '1', front: 'What is the capital of France?', back: 'Paris' },
    { id: '2', front: 'What is 2 + 2?', back: '4' },
    {
      id: '3',
      front: 'Who wrote "Romeo and Juliet"?',
      back: 'William Shakespeare',
    },
  ],
};
