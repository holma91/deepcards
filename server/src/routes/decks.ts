import express from 'express';
import { authenticateUser } from '../middleware/auth';
import { supabase } from '../lib/supabaseClient';

const router = express.Router();

// Get all decks
router.get('', authenticateUser, async (req, res) => {
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

// Create a new deck
router.post('', authenticateUser, async (req, res) => {
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

// Get a single deck
router.get('/:deckId', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { deckId } = req.params;

  try {
    const { data, error } = await supabase
      .from('decks')
      .select('*')
      .eq('id', deckId)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deck' });
  }
});

// Delete a deck
router.delete('/:deckId', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { deckId } = req.params;

  try {
    const { error } = await supabase
      .from('decks')
      .delete()
      .eq('id', deckId)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Deck deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete deck' });
  }
});

// Update a deck
router.patch('/:deckId', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { deckId } = req.params;
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'New name is required' });
  }

  try {
    const { data, error } = await supabase
      .from('decks')
      .update({ name })
      .eq('id', deckId)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update deck name' });
  }
});

export default router;
