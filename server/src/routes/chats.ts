import express from 'express';
import { authenticateUser } from '../middleware/auth';
import { supabase } from '../supabaseClient';
import { keysToCamelCase } from '../utils';

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
    res.json(keysToCamelCase(data));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// Get messages for a specific chat
router.get('/:chatId/messages', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { chatId } = req.params;

  try {
    // First, verify that the chat belongs to the user
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .eq('user_id', req.user.id)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at');

    if (messagesError) throw messagesError;
    res.json(keysToCamelCase(messages));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages' });
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

    res.status(201).json(keysToCamelCase(newChat));
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Failed to create chat' });
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
