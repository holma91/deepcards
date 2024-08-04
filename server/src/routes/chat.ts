import express from 'express';
import { authenticateUser } from '../middleware/auth';
import openai from '../openaiClient';
import { supabase } from '../supabaseClient';

const router = express.Router();

// Helper function to create a new chat
const createNewChat = async (userId: string, title: string) => {
  const { data, error } = await supabase
    .from('chats')
    .insert({ user_id: userId, title })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Helper function to add a message to a chat
const addMessageToChat = async (
  chatId: string,
  role: string,
  content: string
) => {
  const { error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, role, content });

  if (error) throw error;
};

// Route for new chats
router.post('', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { cardContent, messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  try {
    // Create a new chat
    const newChat = await createNewChat(req.user.id, 'New Chat');

    let systemMessage = {
      role: 'system',
      content: 'You are a helpful assistant for a flashcard application.',
    };

    if (cardContent) {
      systemMessage.content +=
        ' The user will provide you with the content of a flashcard and engage in a conversation about it.';
    } else {
      systemMessage.content +=
        ' The user will engage in a general conversation about learning and flashcards.';
    }

    const apiMessages = [
      systemMessage,
      ...(cardContent
        ? [{ role: 'user', content: `Flashcard content: ${cardContent}` }]
        : []),
      ...messages,
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: apiMessages,
    });

    const assistantResponse = completion.choices[0].message.content;

    // Add messages to the new chat
    for (const message of messages) {
      await addMessageToChat(newChat.id, message.role, message.content);
    }
    await addMessageToChat(newChat.id, 'assistant', assistantResponse ?? '');

    res.json({ chatId: newChat.id, response: assistantResponse });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

// Route for existing chats
router.post('/:chatId', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { chatId } = req.params;
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  try {
    // Verify that the chat belongs to the user
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .eq('user_id', req.user.id)
      .single();

    if (chatError || !chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: messages,
    });

    const assistantResponse = completion.choices[0].message.content;

    // Add the new message to the chat
    await addMessageToChat(
      chatId,
      'user',
      messages[messages.length - 1].content
    );
    await addMessageToChat(chatId, 'assistant', assistantResponse ?? '');

    res.json({ chatId, response: assistantResponse });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

export default router;
