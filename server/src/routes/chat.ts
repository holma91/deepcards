import express from 'express';
import { authenticateUser } from '../middleware/auth';
import openai from '../openaiClient';

const router = express.Router();

router.post('', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { cardContent, messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  try {
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

    res.json({ response: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

export default router;
