import express from 'express';
import { authenticateUser } from '../middleware/auth';
import { supabase } from '../supabaseClient';

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
  user_id: string;
  name: string;
  created_at: string;
}

const router = express.Router();

// Get all decks for the user
router.get('/decks', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('user_id', req.user.id)
      .order('name');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch decks' });
  }
});

router.post('/decks', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { id, name } = req.body;

  if (!id || !name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Invalid deck data' });
  }

  try {
    const { data: newDeck, error } = await supabase
      .from('decks')
      .insert({ id, user_id: req.user.id, name: name.trim() })
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(newDeck);
  } catch (error) {
    console.error('Error creating deck:', error);
    res.status(500).json({ error: 'Failed to create deck' });
  }
});

// Get cards due for review (across all decks)
router.get('/due', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', req.user.id)
      .lte('next_review', new Date().toISOString())
      .order('next_review');

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch due cards' });
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

// Create a new card and add it to a deck
router.post('/', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { front, back, deckId } = req.body;

  try {
    const { data: card, error: cardError } = await supabase
      .from('cards')
      .insert({ user_id: req.user.id, front, back })
      .select()
      .single();

    if (cardError || !card)
      throw cardError || new Error('Failed to create card');

    const { error: deckError } = await supabase
      .from('card_decks')
      .insert({ card_id: card.id, deck_id: deckId });

    if (deckError) throw deckError;

    res.status(201).json(card);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create card' });
  }
});

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

router.post('/:id/review', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { id } = req.params;
  const { grade } = req.body;

  try {
    const { data: card, error: fetchError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const { interval, ease_factor } = calculateNextReview(card, grade);

    const { data, error: updateError } = await supabase
      .from('cards')
      .update({
        stage: grade < 3 ? 0 : card.stage + 1,
        ease_factor,
        interval,
        next_review: new Date(
          Date.now() + interval * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update card' });
  }
});

function calculateNextReview(
  card: Card,
  grade: number
): { interval: number; ease_factor: number } {
  let { interval, ease_factor } = card;

  if (grade >= 3) {
    if (interval === 0) {
      interval = 1;
    } else if (interval === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease_factor);
    }
  } else {
    interval = 0;
  }

  ease_factor = ease_factor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  ease_factor = Math.max(1.3, ease_factor);

  return { interval, ease_factor };
}

export default router;
