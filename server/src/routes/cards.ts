import express from 'express';
import { authenticateUser } from '../middleware/auth';
import { supabase } from '../lib/supabaseClient';
import { Database } from '../database.types';

type Card = Database['public']['Tables']['cards']['Row'];

const router = express.Router();

// Get cards due for review (across all decks)
router.get('/due', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const { data, error } = await supabase
      .from('cards')
      .select(
        `
        *,
        card_decks!inner(
          deck:decks(id, name)
        )
      `
      )
      .eq('user_id', req.user.id)
      .lte('next_review', new Date().toISOString())
      .order('next_review');

    if (error) throw error;

    const processedData = data.map((card) => ({
      ...card,
      decks: card.card_decks.map((cd: any) => cd.deck),
    }));

    res.json(processedData);
  } catch (error) {
    console.error('Error fetching due cards:', error);
    res.status(500).json({ error: 'Failed to fetch due cards' });
  }
});

// Get all cards in a specific deck that are due for review
router.get('/deck/:deckId/due', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { deckId } = req.params;

  try {
    const { data, error } = await supabase
      .from('cards')
      .select(
        `
        *,
        card_decks!inner(
          deck:decks(id, name)
        )
      `
      )
      .eq('user_id', req.user.id)
      .eq('card_decks.deck_id', deckId)
      .lte('next_review', new Date().toISOString())
      .order('next_review');

    if (error) throw error;

    const processedData = data.map((card) => ({
      ...card,
      decks: card.card_decks.map((cd: any) => cd.deck),
    }));

    res.json(processedData);
  } catch (error) {
    console.error('Error fetching due cards for deck:', error);
    res.status(500).json({ error: 'Failed to fetch due cards for deck' });
  }
});

// Get all cards in a specific deck
router.get('/deck/:deckId', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { deckId } = req.params;

  try {
    const { data, error } = await supabase
      .from('cards')
      .select(
        `
        *,
        card_decks!inner(deck_id)
      `
      )
      .eq('user_id', req.user.id)
      .eq('card_decks.deck_id', deckId)
      .order('created_at');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cards for deck' });
  }
});

// Get the number of cards due for review in each deck
router.get('/decks/due-counts', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const { data, error } = await supabase
      .from('decks')
      .select(
        `
        id,
        name,
        due_count:card_decks!inner(
          cards!inner(
            id
          )
        )
      `
      )
      .eq('user_id', req.user.id)
      .lte('card_decks.cards.next_review', 'now()');

    if (error) throw error;

    const decksDueCounts = data.map((deck) => ({
      id: deck.id,
      name: deck.name,
      due_count: deck.due_count.length,
    }));

    res.json(decksDueCounts);
  } catch (error) {
    console.error('Error fetching deck due counts:', error);
    res.status(500).json({ error: 'Failed to fetch deck due counts' });
  }
});

// Get all cards for the authenticated user
router.get('/', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const { data, error } = await supabase
      .from('cards')
      .select(
        `
        *,
        card_decks!inner(deck_id)
      `
      )
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json(data);
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

// Get a single card
router.get('/:id', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('cards')
      .select(
        `
        *,
        card_decks!inner(deck_id)
      `
      )
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Card not found' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(500).json({ error: 'Failed to fetch card' });
  }
});

// Create a new card and add it to a deck
router.post('/', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  console.log('req.body', req.body);

  const { front, back, deckId, chatId, suggestionId } = req.body;

  try {
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .insert({
        user_id: req.user.id,
        front,
        back,
        chat_id: chatId,
      })
      .select()
      .single();

    if (cardError || !card) {
      throw cardError || new Error('Failed to create card');
    }

    // Add the card to the deck
    const { error: deckError } = await supabase
      .from('card_decks')
      .insert({ card_id: card.id, deck_id: deckId });

    if (deckError) {
      throw deckError;
    }

    // If a suggestion ID was provided, update the suggestion
    if (suggestionId) {
      const { error: suggestionError } = await supabase
        .from('suggestions')
        .update({ card_id: card.id })
        .eq('id', suggestionId)
        .eq('user_id', req.user.id);

      if (suggestionError) {
        console.error('Error updating suggestion:', suggestionError);
        // Note: We're not throwing this error, as the card was successfully created
      }
    }

    res.status(201).json(card);
  } catch (error) {
    console.error('Error creating card:', error);
    res.status(500).json({ error: 'Failed to create card' });
  }
});

// Update an existing card
router.put('/:id', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { id } = req.params;
  const { front, back } = req.body;

  try {
    const { data: card, error } = await supabase
      .from('cards')
      .update({ front, back })
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error || !card) throw error || new Error('Failed to update card');

    res.status(200).json(card);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update card' });
  }
});

// Delete a card
router.delete('/:cardId', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { cardId } = req.params;

  try {
    // First, check if the card belongs to the user
    const { data: card, error: fetchError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .eq('user_id', req.user.id)
      .single();

    if (fetchError || !card) {
      return res
        .status(404)
        .json({ error: 'Card not found or does not belong to the user' });
    }

    // If the card belongs to the user, delete it
    const { error: deleteError } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId);

    if (deleteError) {
      throw deleteError;
    }

    res.status(200).json({ message: 'Card deleted successfully' });
  } catch (error) {
    console.error('Error deleting card:', error);
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

// Update a reviewed card
router.post('/:id/review', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { id } = req.params;
  const { grade } = req.body;

  console.log('id', id, 'grade', grade);

  try {
    const { data: card, error: fetchError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const updatedCardData = reviewCard(card, grade);

    const { data, error: updateError } = await supabase
      .from('cards')
      .update(updatedCardData)
      .eq('id', id)
      .select();

    if (updateError) {
      throw updateError;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update card' });
  }
});

function reviewCard(card: Card, grade: number) {
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
          card.interval = Math.round(
            (LEARNING_STEPS[0] + LEARNING_STEPS[1]) / 2
          );
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
        card.interval = Math.round(
          (RELEARNING_STEPS[0] + GRADUATING_INTERVAL) / 2
        );
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
        card.ease_factor = Math.max(
          1.3,
          card.ease_factor + EASE_FACTOR_ADJUSTMENT.AGAIN
        );
        break;
      case 2:
        card.interval = Math.max(
          MINIMUM_INTERVAL,
          Math.round(card.interval * INTERVAL_MULTIPLIER.HARD)
        );
        card.ease_factor = Math.max(
          1.3,
          card.ease_factor + EASE_FACTOR_ADJUSTMENT.HARD
        );
        break;
      case 3:
        card.interval = Math.round(card.interval * card.ease_factor);
        // ease factor doesn't change for 'good'
        break;
      case 4:
        card.interval = Math.round(card.interval * INTERVAL_MULTIPLIER.EASY);
        card.ease_factor = Math.max(
          1.3,
          card.ease_factor + EASE_FACTOR_ADJUSTMENT.EASY
        );
        break;
    }
  }

  card.next_review = new Date(
    Date.now() + card.interval * 60 * 1000
  ).toISOString();
  card.last_reviewed_at = new Date().toISOString();

  return card;
}

export default router;
