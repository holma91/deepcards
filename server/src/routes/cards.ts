import express from 'express';
import { authenticateUser } from '../middleware/auth';
import { supabase } from '../supabaseClient';
import { Database } from '../types/supabase/database.types';

type Card = Database['public']['Tables']['cards']['Row'];

const router = express.Router();

router.get('/stats', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const { data: todayCards, error: todayError } = await supabase
      .from('cards')
      .select('created_at, last_reviewed_at')
      .eq('user_id', req.user.id)
      .gte('created_at', today.toISOString());

    if (todayError) {
      console.error("Error fetching today's cards:", todayError);
      return res
        .status(500)
        .json({ error: "Failed to fetch today's card data" });
    }

    const { data: allTimeCards, error: allTimeError } = await supabase
      .from('cards')
      .select('created_at, last_reviewed_at')
      .eq('user_id', req.user.id);

    if (allTimeError) {
      console.error('Error fetching all-time cards:', allTimeError);
      return res
        .status(500)
        .json({ error: 'Failed to fetch all-time card data' });
    }

    const stats = {
      today: {
        reviewed: todayCards.filter(
          (card) =>
            card.last_reviewed_at && new Date(card.last_reviewed_at) >= today
        ).length,
        added: todayCards.length,
      },
      allTime: {
        reviewed: allTimeCards.filter((card) => card.last_reviewed_at).length,
        added: allTimeCards.length,
      },
    };

    res.json(stats);
  } catch (error) {
    console.error('Unexpected error in stats route:', error);
    res.status(500).json({
      error: 'An unexpected error occurred while fetching statistics',
    });
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
        last_reviewed_at: new Date().toISOString(),
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
