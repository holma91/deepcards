import express from 'express';
import { authenticateUser } from '../middleware/auth';
import { supabase } from '../lib/supabaseClient';

const router = express.Router();

// Get user profile
router.get('/', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    return res.json(data);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { theme, review_algorithm, default_chat_model } = req.body;

  const updates: any = {};
  if (theme) updates.theme = theme;
  if (review_algorithm) updates.review_algorithm = review_algorithm;
  if (default_chat_model) updates.default_chat_model = default_chat_model;
  updates.updated_at = new Date().toISOString();

  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;

    return res.json(data);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

export default router;
