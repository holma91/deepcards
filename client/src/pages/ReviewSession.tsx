import React from 'react';
import { useParams } from 'react-router-dom';
import Flashcard from '../components/Flashcard';
import { useReviewCard } from '../hooks/mutations/useReviewCard';
import { useAllDueCards } from '../hooks/useAllDueCards';
import { useDeckDueCards } from '../hooks/useDeckDueCards';

const ReviewSession: React.FC = () => {
  const { deckId } = useParams<{ deckId?: string }>();

  const allDueCardsQuery = useAllDueCards();
  const deckDueCardsQuery = useDeckDueCards(deckId);

  const { isPending, isError, data: cards, error } = deckId ? deckDueCardsQuery : allDueCardsQuery;
  const reviewCardMutation = useReviewCard();

  const handleReview = (grade: number) => {
    if (cards && cards.length > 0) {
      reviewCardMutation.mutate({
        cardId: cards[0].id,
        grade,
        deckIds: deckId ? [deckId] : cards[0].decks.map((deck) => deck.id),
      });
    }
  };

  if (isPending) return <div className="text-xl text-gray-600">Loading cards...</div>;
  if (isError) return <div className="text-xl text-red-600">An error occurred: {error?.message}</div>;
  if (!cards || cards.length === 0) return <div className="text-xl text-gray-600">No cards due for review</div>;

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      <div className="flex-grow flex items-center justify-center px-6">
        <Flashcard key={cards[0].id} card={cards[0]} onReview={handleReview} />
      </div>
    </div>
  );
};

export default ReviewSession;
