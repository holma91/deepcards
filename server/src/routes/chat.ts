import express from 'express';
import { authenticateUser } from '../middleware/auth';
import openai from '../openaiClient';
import { supabase } from '../supabaseClient';
import { z } from 'zod';
import instructor from '../instructorClient';
import { Database } from '../types/supabase/database.types';

type Chat = Database['public']['Tables']['chats']['Row'];
type Card = Database['public']['Tables']['cards']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];
type Suggestion = Database['public']['Tables']['suggestions']['Row'];
type SuggestionInsert = Database['public']['Tables']['suggestions']['Insert'];

type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type TimelineItem =
  | (Message & { type: 'message' })
  | (Suggestion & { type: 'suggestion' });

const router = express.Router();

const ChatResponseSchema = z.object({
  title: z
    .string()
    .max(50)
    .describe(
      'A concise, relevant title for the chat based on the initial message'
    ),
  response: z
    .string()
    .describe("The AI assistant's response to the user's message"),
});

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

const MATH_RENDERING_INSTRUCTIONS = `
Writing math formulas:
You have a KATEX render environment.
- Any LaTeX text between single dollar sign ($) will be rendered as a TeX formula;
- Use $(tex_formula)$ in-line delimiters to display equations instead of backslash;
- The render environment only uses $ (single dollarsign) as a container delimiter, never output $$.
Example: $x^2 + 3x$ is output for "x² + 3x" to appear as TeX.
`;

async function generateFlashcards(messages: OpenAIMessage[]) {
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

async function generateChatTitleAndResponse(
  messages: OpenAIMessage[]
): Promise<{ title: string; response: string }> {
  const result = await instructor.chat.completions.create({
    messages: [
      {
        role: 'system',
        content:
          "You are an AI assistant that generates both a concise chat title and a response to the user's message. The title should be relevant and based on the initial message. The response should be helpful and engaging.",
      },
      ...messages,
    ],
    model: 'gpt-4o',
    response_model: {
      schema: ChatResponseSchema,
      name: 'ChatResponse',
    },
  });

  return result;
}

router.post('/:chatId/cards', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { chatId } = req.params;

  try {
    const { data, error: chatError } = await supabase
      .from('chats')
      .select(
        `
        *,
        cards!chats_card_id_fkey(*),
        messages(*),
        suggestions(*)
      `
      )
      .eq('id', chatId)
      .eq('user_id', req.user.id)
      .single();

    if (chatError) throw chatError;
    if (!data) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const chat = data as Chat & {
      cards: Card | null;
      messages: Message[];
      suggestions: Suggestion[];
    };
    console.log('Chat:', chat);

    const timeline: TimelineItem[] = [
      ...chat.messages.map((msg) => ({ ...msg, type: 'message' as const })),
      ...chat.suggestions.map((sugg) => ({
        ...sugg,
        type: 'suggestion' as const,
      })),
    ].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const originatingCard = chat.cards ? chat.cards : undefined;

    const messages = prepareMessagesForFlashcardGeneration(
      timeline,
      originatingCard
    );

    console.log(
      'Messages for flashcard generation:',
      JSON.stringify(messages, null, 2)
    );

    const generatedCards = await generateFlashcards(messages);

    // insert suggestions here
    const suggestionsToInsert: SuggestionInsert[] = generatedCards.map(
      (card) => ({
        user_id: req.user!.id,
        chat_id: chatId,
        front: card.front,
        back: card.back,
      })
    );

    const { data: insertedSuggestions, error: insertError } = await supabase
      .from('suggestions')
      .insert(suggestionsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting suggestions:', insertError);
      throw insertError;
    }

    res.json({ suggestions: insertedSuggestions });
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
        messages(*, order:created_at),
        suggestions(*, order:created_at)
      `
      )
      .eq('id', chatId)
      .eq('user_id', req.user.id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Destructure and rename as needed
    const { cards, messages, suggestions, ...chatData } = data;
    const responseData = {
      ...chatData,
      card: cards || null,
      messages: messages || [],
      suggestions: suggestions || [],
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
  console.log('req.body:', req.body);

  const { message, cardId } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // If there's an associated card, fetch its content
    let card = undefined;
    if (cardId) {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .eq('id', cardId)
        .single();

      if (error) throw error;
      card = data;
    }

    const apiMessages = prepareMessagesForMessageAndTitleGeneration(
      message,
      card
    );

    console.log('Messages sent to AI:', JSON.stringify(apiMessages, null, 2));

    // Generate chat title and initial response
    const { title, response } = await generateChatTitleAndResponse(apiMessages);

    // Create a new chat with the generated title
    const newChat = await createNewChat(req.user.id, cardId, title);

    // If there's an associated card, update its chat_id
    if (cardId) {
      const { error: updateError } = await supabase
        .from('cards')
        .update({ chat_id: newChat.id })
        .eq('id', cardId);

      if (updateError) throw updateError;
    }

    // Add messages to the new chat
    await addMessageToChat(newChat.id, 'user', message);
    await addMessageToChat(newChat.id, 'assistant', response);

    res.json({ chatId: newChat.id, response, title });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to process chat' });
  }
});
// router.post('', authenticateUser, async (req, res) => {
//   if (!req.user) {
//     return res.status(401).json({ error: 'User not authenticated' });
//   }
//   console.log('req.body:', req.body);

//   const { message, cardId } = req.body;

//   if (!message || typeof message !== 'string') {
//     return res.status(400).json({ error: 'Message is required' });
//   }

//   try {
//     // Create a new chat
//     const newChat = await createNewChat(req.user.id, cardId, 'New Chat');

//     // If there's an associated card, fetch its content
//     let card = undefined;
//     if (cardId) {
//       // First, update the card's chat_id
//       const { data: updatedCard, error: updateError } = await supabase
//         .from('cards')
//         .update({ chat_id: newChat.id })
//         .eq('id', cardId)
//         .select()
//         .single();

//       if (updateError) throw updateError;

//       card = updatedCard;
//     }

//     const apiMessages = prepareMessagesForMessageGeneration([], card);
//     apiMessages.push({ role: 'user', content: message });

//     console.log('Messages sent to AI:', JSON.stringify(apiMessages, null, 2));

//     const completion = await openai.chat.completions.create({
//       model: 'gpt-4o',
//       messages: apiMessages,
//     });

//     const assistantResponse = completion.choices[0].message.content;

//     // Add messages to the new chat
//     await addMessageToChat(newChat.id, 'user', message);
//     await addMessageToChat(newChat.id, 'assistant', assistantResponse ?? '');

//     res.json({ chatId: newChat.id, response: assistantResponse });
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ error: 'Failed to process chat' });
//   }
// });

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
    const { data, error: chatError } = await supabase
      .from('chats')
      .select(
        `
        *,
        cards!chats_card_id_fkey(*),
        messages(*),
        suggestions(*)
      `
      )
      .eq('id', chatId)
      .eq('user_id', req.user.id)
      .single();

    if (chatError) throw chatError;
    if (!data) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const chat = data as Chat & {
      cards: Card | null;
      messages: Message[];
      suggestions: Suggestion[];
    };

    const timeline: TimelineItem[] = [
      ...chat.messages.map((msg) => ({ ...msg, type: 'message' as const })),
      ...chat.suggestions.map((sugg) => ({
        ...sugg,
        type: 'suggestion' as const,
      })),
    ].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const originatingCard = chat.cards ? chat.cards : undefined;

    const apiMessages = prepareMessagesForMessageGeneration(
      timeline,
      originatingCard
    );
    apiMessages.push({ role: 'user', content: message });

    console.log('Messages sent to AI:', JSON.stringify(apiMessages, null, 2));

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

function prepareMessagesForMessageAndTitleGeneration(
  initialMessage: string,
  originatingCard?: Card
): OpenAIMessage[] {
  const systemMessage: OpenAIMessage = {
    role: 'system',
    content: `You are an AI assistant engaged in a conversation to help users learn and understand various topics. 
    Your task is twofold:
    1. Generate a concise and relevant title for this conversation based on its initial message.
    2. Provide an informative and engaging response to the user's message.
    
    ${MATH_RENDERING_INSTRUCTIONS}
    `,
  };

  if (originatingCard) {
    systemMessage.content += `\n\nThis conversation is starting from a review session based on an existing flashcard:
    Front: ${originatingCard.front}
    Back: ${originatingCard.back}
    
    Incorporate this flashcard information into your response if relevant.
    `;
  }

  return [systemMessage, { role: 'user', content: initialMessage }];
}

function prepareMessagesForMessageGeneration(
  timeline: TimelineItem[],
  originatingCard?: Card
): OpenAIMessage[] {
  const systemMessage: OpenAIMessage = {
    role: 'system',
    content: `You are an AI assistant engaged in a conversation to help users learn and understand various topics. 
    The conversation history includes both messages and flashcard suggestions.
    Your role is to provide informative and engaging responses that build upon the existing conversation and flashcard content.
    For flashcard suggestions in the conversation, 'Accepted' means the suggestion was turned into a flashcard, 'Rejected' means it wasn't accepted by the user. 
    You do NOT generate flashcards, you just engage in the conversation
    
    ${MATH_RENDERING_INSTRUCTIONS}
    `,
  };

  if (originatingCard) {
    systemMessage.content += `\n\nFYI,This conversation started from a review session based on an existing flashcard:
    Front: ${originatingCard.front}
    Back: ${originatingCard.back}.
    `;
  }

  const conversationHistory: OpenAIMessage[] = timeline.map(
    (item): OpenAIMessage => {
      if (item.type === 'message') {
        return {
          role: item.role,
          content: item.content,
        };
      } else {
        const status = item.card_id ? 'Accepted' : 'Rejected';
        return {
          role: 'assistant',
          content: `[Flashcard Suggestion (${status}):
        Front: ${item.front}
        Back: ${item.back}]
        Keep this suggested flashcard in mind when continuing the conversation. If rejected, consider why it might not have been suitable.`,
        };
      }
    }
  );

  return [systemMessage, ...conversationHistory];
}

function prepareMessagesForFlashcardGeneration(
  timeline: TimelineItem[],
  originatingCard?: Card
): OpenAIMessage[] {
  let systemMessage = `You are an AI assistant that generates flashcards based on conversations. 
    Analyze the given conversation and create relevant flashcards that capture key information.
    Focus primarily on the most recent parts of the conversation when generating flashcards.
    The number of flashcards you generate should depend on the amount and complexity of information in the conversation, with emphasis on recent topics.
    Generate between 1 to 5 flashcards, focusing on quality and relevance rather than quantity.
    The conversation history includes both messages and previous flashcard suggestions.
    For suggestions, 'Accepted' means the suggestion was turned into a flashcard, 'Rejected' means it wasn't.
    
    ${MATH_RENDERING_INSTRUCTIONS}
    `;

  if (originatingCard) {
    systemMessage += `\n\nThis conversation started from a review session based on an existing flashcard:
    Front: ${originatingCard.front}
    Back: ${originatingCard.back}`;
  }

  const conversationHistory: OpenAIMessage[] = timeline.map((item) => {
    if (item.type === 'message') {
      return { role: item.role, content: item.content };
    } else {
      const status = item.card_id ? 'Accepted' : 'Rejected';
      return {
        role: 'assistant',
        content: `Suggestion (${status}):
        Front: ${item.front}
        Back: ${item.back}`,
      };
    }
  });

  return [
    { role: 'system', content: systemMessage },
    {
      role: 'user',
      content: `Based on the following conversation, generate appropriate flashcards. 
      Focus primarily on the most recent parts of the conversation, as these are likely the most relevant for new flashcards.
      The number of flashcards should reflect the amount of new, substantial information in the recent parts of the conversation, with a maximum of 5 flashcards. 
      Ensure they are unique and don't duplicate existing flashcards or accepted suggestions.
      If the recent parts of the conversation don't contain enough new information for flashcards, you may consider information from earlier in the conversation, but prioritize recency.`,
    },
    ...conversationHistory,
  ];
}

export async function createNewChat(
  userId: string,
  cardId: string | undefined,
  title: string
) {
  const { data, error } = await supabase
    .from('chats')
    .insert({ user_id: userId, card_id: cardId, title })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function addMessageToChat(
  chatId: string,
  role: 'user' | 'assistant',
  content: string
) {
  const { error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, role, content });

  if (error) throw error;
}

export default router;
