import { Card, Message, Suggestion, TimelineItem } from '../types';

export const createTimeline = (messages: Message[], suggestions: Suggestion[]): TimelineItem[] => {
  const timeline = [
    ...messages.map((m) => ({ ...m, type: 'message' as const })),
    ...suggestions.map((s) => ({ ...s, type: 'suggestion' as const })),
  ];

  return timeline.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
};

export function reviewCard(card: Card, grade: number) {
  if (grade < 1 || grade > 4) {
    throw new Error('Invalid grade: must be between 1 and 4');
  }

  const LEARNING_STEPS = [1, 10]; // in minutes
  const GRADUATING_INTERVAL = 1440; // 1 day in minutes
  const EASY_INTERVAL = 5760; // 4 days in minutes

  const EASE_FACTOR_ADJUSTMENT = {
    AGAIN: -0.2,
    HARD: -0.15,
    GOOD: 0,
    EASY: 0.15,
  };

  const INTERVAL_MULTIPLIER = {
    HARD: 1.2,
    GOOD: 2.5,
    EASY: 3.5,
  };

  const MINIMUM_INTERVAL = 1440; // 1 day in minutes
  const RELEARNING_STEPS = [10]; // in minutes

  if (card.status === 'learning') {
    switch (grade) {
      case 1: // Again
        card.learning_step = 0;
        card.interval = LEARNING_STEPS[0];
        break;
      case 2: // Hard
        if (card.learning_step === 0) {
          // Average of first two steps
          card.interval = Math.round((LEARNING_STEPS[0] + LEARNING_STEPS[1]) / 2);
        } else {
          // Repeat the current step
          card.interval = LEARNING_STEPS[card.learning_step];
        }
        break;
      case 3: // Good
        card.learning_step++;
        if (card.learning_step >= LEARNING_STEPS.length) {
          // Graduate the card
          card.status = 'reviewing';
          card.learning_step = 0;
          card.interval = GRADUATING_INTERVAL;
        } else {
          card.interval = LEARNING_STEPS[card.learning_step];
        }
        break;
      case 4: // Easy
        // Graduate the card immediately
        card.status = 'reviewing';
        card.learning_step = 0;
        card.interval = EASY_INTERVAL;
        break;
    }
  } else if (card.status === 'relearning') {
    switch (grade) {
      case 1:
        card.learning_step = 0;
        card.interval = RELEARNING_STEPS[0];
        break;
      case 2:
        // Average of Again (first step) and Good (graduating)
        card.interval = Math.round((RELEARNING_STEPS[0] + GRADUATING_INTERVAL) / 2);
        break;
      case 3:
        // Graduate the card back to reviewing
        card.status = 'reviewing';
        card.learning_step = 0;
        card.interval = GRADUATING_INTERVAL;
        break;
      case 4:
        // Graduate the card immediately back to reviewing
        card.status = 'reviewing';
        card.learning_step = 0;
        card.interval = EASY_INTERVAL;
        break;
    }
  } else if (card.status === 'reviewing') {
    switch (grade) {
      case 1:
        // Move to relearning
        card.status = 'relearning';
        card.learning_step = 0;
        card.interval = MINIMUM_INTERVAL;
        card.ease_factor = Math.max(1.3, card.ease_factor + EASE_FACTOR_ADJUSTMENT.AGAIN);
        break;
      case 2:
        card.interval = Math.max(MINIMUM_INTERVAL, Math.round(card.interval * INTERVAL_MULTIPLIER.HARD));
        card.ease_factor = Math.max(1.3, card.ease_factor + EASE_FACTOR_ADJUSTMENT.HARD);
        break;
      case 3:
        card.interval = Math.round(card.interval * card.ease_factor);
        // ease factor doesn't change for 'good'
        break;
      case 4:
        card.interval = Math.round(card.interval * INTERVAL_MULTIPLIER.EASY);
        card.ease_factor = Math.max(1.3, card.ease_factor + EASE_FACTOR_ADJUSTMENT.EASY);
        break;
    }
  }

  card.next_review = new Date(Date.now() + card.interval * 60 * 1000).toISOString();
  card.last_reviewed_at = new Date().toISOString();

  return card;
}
