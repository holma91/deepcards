import express from 'express';
import { authenticateUser } from '../middleware/auth';
import openai from '../lib/openaiClient';
import { supabase } from '../lib/supabaseClient';
import { z } from 'zod';
import instructor from '../lib/instructorClient';
import { Database } from '../database.types';

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
You have access to a KaTeX render environment for displaying mathematical expressions. Follow these guidelines and be aware of some limitations:

1. Inline Math:
   - Use single dollar signs ($) to delimit inline math expressions.
   - Example: The set of rational numbers is denoted as $\mathbb{Q}$.

2. Display Math:
   - Use double dollar signs ($$) for centered, display-style math on its own line.
   - Example: The quadratic formula solution is:
     $$x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$$

3. Common LaTeX Commands:
   - Superscripts: Use ^ (e.g., $x^2$ for x²)
   - Subscripts: Use _ (e.g., $x_1$ for x₁)
   - Fractions: Use \frac{numerator}{denominator} (e.g., $\frac{1}{2}$ for ½)
   - Square roots: Use \sqrt{} (e.g., $\sqrt{x}$ for √x)
   - Greek letters: Use \ followed by the name (e.g., $\alpha$, $\beta$, $\pi$)
   - Trigonometric functions: Use \ followed by the function name (e.g., $\sin(x)$, $\cos(x)$)

4. Set Theory and Number Systems:
   - Use \mathbb{} for number set symbols: $\mathbb{N}$, $\mathbb{Z}$, $\mathbb{Q}$, $\mathbb{R}$, $\mathbb{C}$
   - Do not use \textbf{} for these symbols, as it won't render correctly

5. Emphasis in Math Mode:
   - Use \boldsymbol{} for bold symbols in math mode, not \textbf{}
   - Example: $\boldsymbol{v}$ for a vector v

6. Multi-line Equations:
   - Use \\ for line breaks inside math environments, not \n
   - Example:
     $$
     f(x) = ax^2 + bx + c \\
     g(x) = dx + e
     $$

7. Limitations and Best Practices:
   - Avoid using text-mode commands like \text{} or \textbf{} inside math delimiters
   - Stick to basic math notation and commonly used symbols
   - For complex layouts, use multiple math environments instead of advanced LaTeX environments
   - If a command doesn't render correctly, try finding a math-mode alternative

Remember to use math notation when it enhances clarity and readability. For simple expressions in explanatory text, plain language may be more appropriate.
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

const MESSAGE_AND_TITLE_GENERATION_INSTRUCTIONS = `You are an AI assistant engaged in a conversation to help users learn and understand various topics. Your task is to generate a concise, relevant title for the conversation and provide an informative and engaging response to the user's message.

Formatting Guidelines:
- Use markdown for text formatting to enhance readability:
  * **bold** for key terms or important concepts
  * *italics* for emphasis
  * \` for inline code or technical terms
  * \`\`\` for multi-line code blocks (specify the language for syntax highlighting)
  * > for quotations
  * Bullet points (- or *) for lists
  * Numbered lists (1. 2. 3.) for sequential steps

${MATH_RENDERING_INSTRUCTIONS}
`;

function prepareMessagesForMessageAndTitleGeneration(
  initialMessage: string,
  originatingCard?: Card
): OpenAIMessage[] {
  const systemMessage: OpenAIMessage = {
    role: 'system',
    content: MESSAGE_AND_TITLE_GENERATION_INSTRUCTIONS,
  };

  if (originatingCard) {
    systemMessage.content += `\n\nThis conversation is starting from a review session based on an existing flashcard:
    Front: ${originatingCard.front}
    Back: ${originatingCard.back}
    
    Consider this flashcard information when generating the title and incorporate it into your response if relevant.
    `;
  }

  return [systemMessage, { role: 'user', content: initialMessage }];
}

const MESSAGE_GENERATION_INSTRUCTIONS = `You are an AI assistant engaged in a conversation to help users learn and understand various topics. Your primary goals are to:

1. Provide informative and engaging responses that build upon the existing conversation and flashcard content.
2. Elaborate on concepts mentioned in flashcards to deepen understanding.
3. Provide examples and real-world applications of the concepts being discussed.
4. Clarify misconceptions and provide additional context when necessary.
5. Adapt your language and explanation style based on the user's apparent level of understanding.

The conversation history includes both messages and flashcard suggestions. For flashcard suggestions:
- 'Accepted' means the suggestion was turned into a flashcard. Reference this content in your responses when relevant.
- 'Rejected' means it wasn't accepted by the user. Consider why it might not have been suitable and avoid similar content unless it becomes more relevant.
- 'Modified' means the user edited the suggestion before accepting it. Pay attention to these modifications as they may indicate user preferences or nuances in understanding.

Remember:
- You do NOT generate flashcards; you engage in the conversation to support learning.
- Encourage the user to make connections between different concepts and flashcards.
- If the user seems to struggle with a concept, break it down into simpler parts or provide analogies.
- Occasionally summarize key points discussed to reinforce learning.

Formatting Guidelines:
- Use markdown for text formatting to enhance readability and emphasize important points:
  * Use **bold** for key terms or important concepts.
  * Use *italics* for emphasis or to highlight secondary points.
  * Use backticks (\`) for inline code or technical terms.
  * Use triple backticks (\`\`\`) for multi-line code blocks or longer technical explanations.
  * Use > for quotations or to highlight important statements.
  * Use bullet points (- or *) for lists of related items.
  * Use numbered lists (1. 2. 3.) for sequential steps or prioritized points.

${MATH_RENDERING_INSTRUCTIONS}

When using code blocks, specify the language immediately after the opening triple backticks for proper syntax highlighting, e.g., \`\`\`python.
`;

function prepareMessagesForMessageGeneration(
  timeline: TimelineItem[],
  originatingCard?: Card
): OpenAIMessage[] {
  const systemMessage: OpenAIMessage = {
    role: 'system',
    content: MESSAGE_GENERATION_INSTRUCTIONS,
  };

  if (originatingCard) {
    systemMessage.content += `\n\nThis conversation started from a review session based on an existing flashcard:
    Front: ${originatingCard.front}
    Back: ${originatingCard.back}
    Use this as a starting point for the conversation, but feel free to explore related topics as the discussion progresses.`;
  }

  const conversationHistory: OpenAIMessage[] = timeline.map(
    (item): OpenAIMessage => {
      if (item.type === 'message') {
        return { role: item.role, content: item.content };
      } else {
        let status = item.card_id
          ? item.modified_front || item.modified_back
            ? 'Accepted after modification'
            : 'Accepted'
          : 'Rejected';

        let content = `[Flashcard Suggestion (${status}):
        Front: ${item.front}
        Back: ${item.back}`;

        if (item.modified_front || item.modified_back) {
          content += `
        Modified Front: ${item.modified_front || item.front}
        Modified Back: ${item.modified_back || item.back}`;
        }

        content += `]
        Consider this flashcard content in your responses. If accepted, reference it when relevant. If rejected, reflect on why it might not have been suitable. If modified, note the changes as they may indicate important nuances.`;

        return { role: 'assistant', content: content };
      }
    }
  );

  return [systemMessage, ...conversationHistory];
}

const FLASHCARD_GENERATION_INSTRUCTIONS = `
You are an AI assistant that generates high-quality flashcards based on conversations. Analyze the given conversation and create relevant flashcards that capture key information. Follow these guidelines:

1. Context Awareness:
   - The conversation history includes both messages and previous flashcard suggestions.
   - Pay close attention to the status of previous suggestions:
     * 'Accepted': The suggestion was turned into a flashcard. Avoid duplicating this content.
     * 'Rejected': The suggestion wasn't accepted by the user. Avoid similar suggestions unless the topic becomes more relevant later in the conversation.
     * 'Accepted after modification': The user edited the suggestion before accepting it. Pay special attention to these modifications as they indicate user preferences or corrections.

2. Structure and Content:
   - Create flashcards in a question-answer format.
   - Front: Clear, specific question that prompts active recall.
   - Back: Concise, accurate answer.
   - Focus on a single concept or fact per flashcard (atomicity).
   - Break down complex ideas into multiple, simpler flashcards.
   - Prioritize the most important and relevant information, especially from recent parts of the conversation.

3. Quality and Quantity:
   - Generate 1 to 5 flashcards, based on the amount and complexity of new information.
   - Ensure conciseness, clarity, and factual accuracy.
   - Provide necessary context without overloading the card.
   - Avoid duplicating content from accepted or modified flashcards.

4. Formatting:
   - Use markdown for text formatting (e.g., **bold**, *italic*).
   - Use backticks for inline code and triple backticks for code blocks.
   ${MATH_RENDERING_INSTRUCTIONS}

5. Continuous Improvement:
   - Learn from user modifications. If a user consistently modifies suggestions in a certain way, try to incorporate that style in future suggestions.
   - If a topic was rejected earlier but becomes more relevant later in the conversation, you may suggest a refined version of it.

6. Examples of Good and Bad Flashcards:

Bad Example (Ill-formulated knowledge - Complex and wordy):
Q: What are the characteristics of the Dead Sea?
A: Salt lake located on the border between Israel and Jordan. Its shoreline is the lowest point on the Earth's surface, averaging 396 m below sea level. It is 74 km long. It is seven times as salty (30% by volume) as the ocean. Its density keeps swimmers afloat. Only simple organisms can live in its saline waters

Good Examples (Well-formulated knowledge - Simple and specific):
Q: Where is the Dead Sea located?
A: On the border between Israel and Jordan

Q: What is the lowest point on the Earth's surface?
A: The Dead Sea shoreline

Q: How much saltier is the Dead Sea than the oceans?
A: 7 times

Q: Why can the Dead Sea keep swimmers afloat?
A: Due to high salt content

Q: Why is the Dead Sea called Dead?
A: Because only simple organisms can live in it

Notice how the good examples break down the complex information into simple, specific questions and answers. Each flashcard focuses on a single piece of information, making them easier to learn and remember.

Remember, the goal is to create flashcards that effectively aid learning and retention while aligning with the user's preferences as indicated by their acceptance, rejection, and modification patterns.`;

function prepareMessagesForFlashcardGeneration(
  timeline: TimelineItem[],
  originatingCard?: Card
): OpenAIMessage[] {
  let systemMessage = FLASHCARD_GENERATION_INSTRUCTIONS;

  if (originatingCard) {
    systemMessage += `\n\nThis conversation started from a review session based on an existing flashcard:
    Front: ${originatingCard.front}
    Back: ${originatingCard.back}`;
  }

  const conversationHistory: OpenAIMessage[] = timeline.map((item) => {
    if (item.type === 'message') {
      return { role: item.role, content: item.content };
    } else {
      let status = item.card_id
        ? item.modified_front || item.modified_back
          ? 'Accepted after modification'
          : 'Accepted'
        : 'Rejected';

      let content = `Suggestion (${status}):
        Front: ${item.front}
        Back: ${item.back}`;

      if (item.modified_front || item.modified_back) {
        content += `
        Modified Front: ${item.modified_front || item.front}
        Modified Back: ${item.modified_back || item.back}`;
      }

      return { role: 'assistant', content: content };
    }
  });

  // Limit conversation history to last 50 items if it's too long
  const limitedHistory = conversationHistory.slice(-50);

  // Count the number of accepted and rejected suggestions
  const suggestionCounts = limitedHistory.reduce(
    (acc, item) => {
      if (item.role === 'assistant' && item.content.startsWith('Suggestion')) {
        const status = item.content.includes('Accepted')
          ? 'accepted'
          : 'rejected';
        acc[status]++;
      }
      return acc;
    },
    { accepted: 0, rejected: 0 }
  );

  const finalUserMessage = `Based on our conversation, please generate appropriate flashcards. 
    Focus on the most recent and important information.
    Generate between 1 to 5 high-quality flashcards.
    ${
      suggestionCounts.accepted > 0
        ? `Consider the patterns in the ${suggestionCounts.accepted} accepted suggestions when creating new ones.`
        : ''
    }
    ${
      suggestionCounts.rejected > 0
        ? `Be mindful of the ${suggestionCounts.rejected} rejected suggestions and try to understand why they might not have been suitable.`
        : ''
    }
    If you're unsure about generating any new flashcards, it's okay to suggest fewer or none.`;

  return [
    { role: 'system', content: systemMessage },
    ...limitedHistory,
    { role: 'user', content: finalUserMessage },
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
