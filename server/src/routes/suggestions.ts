import express from 'express';
import { authenticateUser } from '../middleware/auth';
import { supabase } from '../supabaseClient';

const router = express.Router();

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

router.patch('/:suggestionId', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { suggestionId } = req.params;
  const { status } = req.body;

  try {
    const { data, error } = await supabase
      .from('suggestions')
      .update({ status })
      .eq('id', suggestionId)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating suggestion:', error);
    res.status(500).json({ error: 'Failed to update suggestion' });
  }
});

router.post('/:suggestionId/accept', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { suggestionId } = req.params;
  const { deckId, deckName } = req.body;

  try {
    // First, update the suggestion
    const { data: suggestionData, error: suggestionError } = await supabase
      .from('suggestions')
      .update({ status: 'accepted' })
      .eq('id', suggestionId)
      .select();

    if (suggestionError) throw suggestionError;
    if (!suggestionData || suggestionData.length === 0) {
      throw new Error('Suggestion not found');
    }

    const updatedSuggestion = suggestionData[0];

    // Then, create a new card
    const { data: cardData, error: cardError } = await supabase
      .from('cards')
      .insert({
        user_id: req.user.id,
        front: updatedSuggestion.front,
        back: updatedSuggestion.back,
      })
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
