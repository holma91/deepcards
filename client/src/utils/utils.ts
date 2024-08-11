import { Message, Suggestion, TimelineItem } from '../types';

export const createTimeline = (messages: Message[], suggestions: Suggestion[]): TimelineItem[] => {
  const timeline = [
    ...messages.map((m) => ({ ...m, type: 'message' as const })),
    ...suggestions.map((s) => ({ ...s, type: 'suggestion' as const })),
  ];

  return timeline.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
};
