import express from 'express';
import { authenticateUser } from '../middleware/auth';
import openai from '../openaiClient';
import { supabase } from '../supabaseClient';
import { z } from 'zod';
import instructor from '../instructorClient';

type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

type ExistingCard = {
  front: string;
  back: string;
};

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

function prepareMessagesForFlashcardGeneration(
  conversationHistory: Message[],
  existingCard?: ExistingCard,
  count: number = 3
): Message[] {
  let systemMessage = `You are an AI assistant that generates flashcards based on conversations. 
    Create concise, relevant flashcards that capture key information from the given conversation.`;

  if (existingCard) {
    systemMessage += `\n\nThis conversation is based on an existing flashcard:
    Front: ${existingCard.front}
    Back: ${existingCard.back}
    
    When generating new flashcards, focus on complementary information or different aspects of the topic that aren't directly covered by the existing flashcard.`;
  }

  return [
    { role: 'system', content: systemMessage },
    {
      role: 'user',
      content: `Generate ${count} flashcards based on the following conversation. ${
        existingCard
          ? 'Ensure they complement the existing flashcard without duplicating its content.'
          : ''
      }`,
    },
    ...conversationHistory,
  ];
}

async function generateFlashcards(messages: Message[]) {
  const result = await instructor.chat.completions.create({
    messages,
    model: 'gpt-4o',
    response_model: {
      schema: FlashcardsSchema,
      name: 'Flashcards',
    },
  });

  return result.flashcards;
}

router.post('/:chatId/cards', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { chatId } = req.params;
  const { count = 3 } = req.query;

  try {
    const { data: chat, error: chatError } = await supabase
      .from('chats')
      .select(
        `
        *,
        cards!chats_card_id_fkey(*),
        messages(*)
      `
      )
      .eq('id', chatId)
      .eq('user_id', req.user.id)
      .single();

    if (chatError) throw chatError;
    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const conversationHistory: Message[] = chat.messages
      .sort(
        (a: any, b: any) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )
      .map(
        ({
          role,
          content,
        }: {
          role: 'user' | 'assistant';
          content: string;
        }) => ({ role, content })
      );

    const existingCard: ExistingCard | undefined = chat.cards
      ? { front: chat.cards.front, back: chat.cards.back }
      : undefined;

    const messages = prepareMessagesForFlashcardGeneration(
      conversationHistory,
      existingCard,
      Number(count)
    );

    console.log(
      'Messages for flashcard generation:',
      JSON.stringify(messages, null, 2)
    );

    const generatedCards = await generateFlashcards(messages);

    // insert suggestions here

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
        cards!chats_card_id_fkey(*),
        messages(*, order:created_at)
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
    const { cards, messages, ...chatData } = data;
    const responseData = {
      ...chatData,
      card: cards || null,
      messages: messages || [],
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

  const { message, cardId } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Create a new chat
    const newChat = await createNewChat(req.user.id, cardId, 'New Chat');

    // If there's an associated card, fetch its content
    let card = null;
    if (cardId) {
      const { data: cardData, error: cardError } = await supabase
        .from('cards')
        .select('*')
        .eq('id', cardId)
        .single();

      if (cardError) throw cardError;
      card = cardData;
    }

    const apiMessages = constructApiMessages([], card);
    apiMessages.push({ role: 'user', content: message });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: apiMessages,
    });

    const assistantResponse = completion.choices[0].message.content;

    // Add messages to the new chat
    await addMessageToChat(newChat.id, 'user', message);
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
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // get chat history
    const { data: chatData, error: chatError } = await supabase
      .from('chats')
      .select(
        `
        *,
        cards!chats_card_id_fkey(*),
        messages!chat_id(*)
      `
      )
      .eq('id', chatId)
      .eq('user_id', req.user.id)
      .single();

    if (chatError || !chatData) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // put chat in order
    const sortedMessages = chatData.messages.sort(
      (a: any, b: any) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const { cards: card, ...chat } = chatData;

    // construct the message chain for the LLM
    const apiMessages = constructApiMessages(sortedMessages, card);
    apiMessages.push({ role: 'user', content: message });

    console.log('Messages sent to AI:', apiMessages);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: apiMessages,
    });

    const assistantResponse = completion.choices[0].message.content;

    await addMessageToChat(chatId, 'user', message);
    await addMessageToChat(chatId, 'assistant', assistantResponse ?? '');

    res.json({ response: assistantResponse, chatId: chatId });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
});

function constructApiMessages(
  messages: any[],
  card: any | null
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const apiMessages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }> = [];

  apiMessages.push({
    role: 'system',
    content: 'You are a helpful assistant for a flashcard application.',
  });

  if (card) {
    apiMessages.push({
      role: 'system',
      content: `Flashcard content:\nFront: ${card.front}\nBack: ${card.back}`,
    });
  }

  messages.forEach((msg) => {
    apiMessages.push({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    });
  });

  return apiMessages;
}

const createNewChat = async (
  userId: string,
  cardId: string | null,
  title: string
) => {
  const { data, error } = await supabase
    .from('chats')
    .insert({ user_id: userId, card_id: cardId, title })
    .select()
    .single();

  if (error) throw error;
  return data;
};

async function addMessageToChat(chatId: string, role: string, content: string) {
  const { error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, role, content });

  if (error) throw error;
}

export default router;
