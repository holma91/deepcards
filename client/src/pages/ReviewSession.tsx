import React from 'react';
import { useParams } from 'react-router-dom';
import Flashcard from '../components/Flashcard';
import { useReviews } from '../hooks/useReviews';
import { useReviewCard } from '../hooks/mutations/useReviewCard';

const ReviewSession: React.FC = () => {
  const { deckId } = useParams<{ deckId?: string }>();
  const { isPending, isError, data: cards, error } = useReviews(deckId);
  const reviewCardMutation = useReviewCard();

  const handleReview = (grade: number) => {
    if (cards && cards.length > 0) {
      reviewCardMutation.mutate({
        cardId: cards[0].id,
        grade,
        deckId: deckId || cards[0].deckId, // Use the URL deckId if available, otherwise use the card's deckId
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 max-w-4xl mx-auto">
      {isPending ? (
        <div className="text-xl text-gray-600">Loading cards...</div>
      ) : isError ? (
        <div className="text-xl text-red-600">
          An error occurred: {error?.message}
        </div>
      ) : !cards || cards.length === 0 ? (
        <div className="text-xl text-gray-600">No cards due for review</div>
      ) : (
        <Flashcard key={cards[0].id} card={cards[0]} onReview={handleReview} />
      )}
    </div>
  );
};

export default ReviewSession;
