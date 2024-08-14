import express from 'express';
import { authenticateUser } from '../middleware/auth';
import { supabase } from '../lib/supabaseClient';

const router = express.Router();

// Get all chats
router.get('', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Create a new chat
router.post('', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { title } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Invalid chat title' });
  }

  try {
    const { data: newChat, error } = await supabase
      .from('chats')
      .insert({ user_id: req.user.id, title: title.trim() })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(newChat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// Rename a chat
router.patch('/:chatId', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { chatId } = req.params;
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'New title is required' });
  }

  try {
    const { data, error } = await supabase
      .from('chats')
      .update({ title })
      .eq('id', chatId)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error renaming chat:', error);
    res.status(500).json({ error: 'Failed to rename chat' });
  }
});

// Delete a chat
router.delete('/:chatId', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { chatId } = req.params;

  try {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)
      .eq('user_id', req.user.id);

    if (error) throw error;
    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete chat' });
  }
});

export default router;
