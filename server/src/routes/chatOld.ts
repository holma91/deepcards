import express from 'express';
import { authenticateUser } from '../middleware/auth';
import openai from '../openaiClient';
import { supabase } from '../supabaseClient';
import { z } from 'zod';
import instructor from '../instructorClient';

const router = express.Router();

const FlashcardSchema = z.object({
  front: z
    .string()
    .describe('The question or prompt on the front of the flashcard'),
  back: z
    .string()
    .describe('The answer or explanation on the back of the flashcard'),
});

const FlashcardsSchema = z.object({
  flashcards: z
    .array(FlashcardSchema)
    .describe('An array of flashcards generated from the conversation'),
});

// Function to generate flashcards
async function generateFlashcards(conversationHistory: string) {
  const result = await instructor.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          'You are an AI assistant that generates flashcards based on conversations. Create concise, relevant flashcards that capture key information from the given conversation.',
      },
      {
        role: 'user',
        content: `Generate 3 flashcards based on the following conversation:\n\n${conversationHistory}`,
      },
    ],
    model: 'gpt-4o',
    response_model: {
      schema: FlashcardsSchema,
      name: 'Flashcards',
    },
  });

  return result.flashcards;
}

// Helper function to create a new chat
const createNewChat = async (userId: string, cardId: string, title: string) => {
  const { data, error } = await supabase
    .from('chats')
    .insert({ user_id: userId, card_id: cardId, title })
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

router.post('/:chatId/cards', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { chatId } = req.params;

  try {
    // Fetch the chat messages
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    // Prepare the conversation history
    const conversationHistory = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    // Generate flashcards
    const generatedCards = await generateFlashcards(conversationHistory);

    // Instead of saving to the database, just return the generated cards
    res.json({ cards: generatedCards });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to generate flashcards' });
  }
});

router.get('/:chatId', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { chatId } = req.params;

  try {
    const { data, error } = await supabase
      .from('chats')
      .select(
        `
        *,
        cards:card_id(*)
      `
      )
      .eq('id', chatId)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Rename 'cards' to 'card' and ensure it's an object, not an array
    const { cards, ...chatData } = data;
    const responseData = {
      ...chatData,
      card: cards || null,
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
});

// Route for new chats
router.post('', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { cardContent, cardId, messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  try {
    // Create a new chat
    const newChat = await createNewChat(req.user.id, cardId, 'New Chat');

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
  const { messages, cardContent } = req.body;

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

    let apiMessages = messages;

    if (cardContent) {
      const systemMessage = {
        role: 'system',
        content:
          'You are a helpful assistant for a flashcard application. The user will provide you with the content of a flashcard and engage in a conversation about it.',
      };
      const cardContentMessage = {
        role: 'user',
        content: `Flashcard content: ${cardContent}`,
      };
      apiMessages = [systemMessage, cardContentMessage, ...messages];
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: apiMessages,
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
