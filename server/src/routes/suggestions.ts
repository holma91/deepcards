import express from 'express';
import { authenticateUser } from '../middleware/auth';
import { supabase } from '../lib/supabaseClient';
import { Database } from '../database.types';

const router = express.Router();

// get pending suggestions for a chat
router.get('/pending/:chatId', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { chatId } = req.params;

  try {
    const { data, error } = await supabase
      .from('suggestions')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('chat_id', chatId)
      .eq('status', 'pending')
      .order('id', { ascending: true });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching pending suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch pending suggestions' });
  }
});

router.delete('/', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { suggestionIds } = req.body;

  if (!Array.isArray(suggestionIds) || suggestionIds.length === 0) {
    return res.status(400).json({ error: 'Invalid suggestion IDs' });
  }

  try {
    const { data, error } = await supabase
      .from('suggestions')
      .delete()
      .in('id', suggestionIds)
      .eq('user_id', req.user.id)
      .select();

    if (error) throw error;

    res.json({ deletedSuggestions: data });
  } catch (error) {
    console.error('Error deleting suggestions:', error);
    res.status(500).json({ error: 'Failed to delete suggestions' });
  }
});

type SuggestionUpdate = Database['public']['Tables']['suggestions']['Update'];

router.patch('/:suggestionId', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { suggestionId } = req.params;
  const { status, modified_front, modified_back } = req.body;

  try {
    const updateData: SuggestionUpdate = {};

    if (status !== undefined) {
      updateData.status = status;
    }

    if (modified_front !== undefined) {
      updateData.modified_front = modified_front;
    }

    if (modified_back !== undefined) {
      updateData.modified_back = modified_back;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid update data provided' });
    }

    const { data, error } = await supabase
      .from('suggestions')
      .update(updateData)
      .eq('id', suggestionId)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating suggestion:', error);
    res.status(500).json({ error: 'Failed to update suggestion' });
  }
});

type InsertCard = Database['public']['Tables']['cards']['Insert'];

router.post('/:suggestionId/accept', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { suggestionId } = req.params;
  const { deckId, deckName } = req.body;

  try {
    // Update the suggestion and fetch its data
    const { data: suggestionData, error: suggestionError } = await supabase
      .from('suggestions')
      .update({ status: 'accepted' })
      .eq('id', suggestionId)
      .select('*')
      .single();

    if (suggestionError) throw suggestionError;
    if (!suggestionData) {
      throw new Error('Suggestion not found');
    }

    const updatedSuggestion = suggestionData;

    const cardFront =
      updatedSuggestion.modified_front || updatedSuggestion.front;
    const cardBack = updatedSuggestion.modified_back || updatedSuggestion.back;

    // Create a new card
    const { data: cardData, error: cardError } = await supabase
      .from('cards')
      .insert({
        user_id: req.user.id,
        front: cardFront,
        back: cardBack,
      } as InsertCard)
      .select();

    if (cardError) throw cardError;
    if (!cardData || cardData.length === 0) {
      throw new Error('Failed to create card');
    }

    const newCard = cardData[0];

    // Add the card to the deck
    const { error: deckError } = await supabase
      .from('card_decks')
      .insert({ card_id: newCard.id, deck_id: deckId });

    if (deckError) throw deckError;

    // Update the suggestion with the new card_id
    const { error: updateError } = await supabase
      .from('suggestions')
      .update({ card_id: newCard.id })
      .eq('id', suggestionId);

    if (updateError) throw updateError;

    res.json({ suggestion: updatedSuggestion, card: newCard });
  } catch (error) {
    console.error('Error accepting suggestion:', error);
    res.status(500).json({ error: 'Failed to accept suggestion' });
  }
});

export default router;
