import React from 'react';
import Flashcard from '../components/Flashcard';
import { useReviews } from '../hooks/useReviews';
import { useReviewCard } from '../hooks/mutations/useReviewCard';

const ReviewSession: React.FC = () => {
  const { isPending, isError, data: cards, error } = useReviews();
  const reviewCardMutation = useReviewCard();

  const handleReview = (grade: number) => {
    if (cards && cards.length > 0) {
      console.log('grade', grade);
      reviewCardMutation.mutate({ cardId: cards[0].id, grade });
    }
  };

  const renderContent = () => {
    if (isPending) {
      return <div className="text-xl text-gray-600">Loading cards...</div>;
    }

    if (isError) {
      return (
        <div className="text-xl text-red-600">
          An error occurred: {error?.message}
        </div>
      );
    }

    if (!cards || cards.length === 0) {
      return (
        <div className="text-xl text-gray-600">No cards due for review</div>
      );
    }

    return (
      <Flashcard key={cards[0].id} card={cards[0]} onReview={handleReview} />
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 max-w-4xl mx-auto">
      {renderContent()}
    </div>
  );
};

export default ReviewSession;
