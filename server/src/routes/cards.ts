import express from 'express';
import { authenticateUser } from '../middleware/auth';
import { supabase } from '../supabaseClient';

export interface Card {
  id: string;
  user_id: string;
  front: string;
  back: string;
  stage: number;
  ease_factor: number;
  interval: number;
  next_review: string;
  created_at: string;
}

const router = express.Router();

router.get('/', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', req.user.id)
      .lte('next_review', new Date().toISOString())
      .order('next_review');

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});

router.post('/:id/review', authenticateUser, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { id } = req.params;
  const { grade } = req.body;

  try {
    const { data: card, error: fetchError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const { interval, ease_factor } = calculateNextReview(card, grade);

    const { data, error: updateError } = await supabase
      .from('cards')
      .update({
        stage: grade < 3 ? 0 : card.stage + 1,
        ease_factor,
        interval,
        next_review: new Date(
          Date.now() + interval * 24 * 60 * 60 * 1000
        ).toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update card' });
  }
});

function calculateNextReview(
  card: Card,
  grade: number
): { interval: number; ease_factor: number } {
  let { interval, ease_factor } = card;

  if (grade >= 3) {
    if (interval === 0) {
      interval = 1;
    } else if (interval === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease_factor);
    }
  } else {
    interval = 0;
  }

  ease_factor = ease_factor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
  ease_factor = Math.max(1.3, ease_factor);

  return { interval, ease_factor };
}

export default router;
