import React from 'react';
import { useParams } from 'react-router-dom';
import Flashcard from '../components/Flashcard';
import { useReviewCard } from '../hooks/mutations/useReviewCard';
import { useAllDueCards } from '../hooks/useAllDueCards';
import { useDeckDueCards } from '../hooks/useDeckDueCards';
import LoadingScreen from '../components/LoadingScreen';

const Review: React.FC = () => {
  const { deckId } = useParams<{ deckId?: string }>();

  const allDueCardsQuery = useAllDueCards();
  const deckDueCardsQuery = useDeckDueCards(deckId);

  const { isPending, isError, data: cards, error, refetch } = deckId ? deckDueCardsQuery : allDueCardsQuery;
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

  const renderContent = () => {
    if (isPending) return <LoadingScreen />;
    if (isError) return <ErrorState error={error} onRetry={refetch} />;
    if (!cards || cards.length === 0) return <EmptyState />;
    return <Flashcard key={cards[0].id} card={cards[0]} onReview={handleReview} />;
  };

  return (
    <div className="h-full flex items-center justify-center px-2 sm:px-6">
      <div className="h-full w-full max-w-3xl flex-grow flex items-center justify-center px-2 sm:p-6">
        {renderContent()}
      </div>
    </div>
  );
};

const ErrorState: React.FC<{ error: Error | null; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="text-center px-4">
    <p className="text-lg sm:text-xl text-red-600 mb-2 sm:mb-4">An error occurred while loading cards</p>
    <p className="text-sm sm:text-base text-gray-600 mb-4">{error?.message || 'Please try again'}</p>
    <button
      onClick={onRetry}
      className="px-4 py-2 bg-gray-900 text-white text-sm sm:text-base rounded hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
    >
      Retry
    </button>
  </div>
);

const EmptyState: React.FC = () => (
  <div className="text-center px-4">
    <p className="text-lg sm:text-xl text-gray-600 mb-2 sm:mb-4">No cards due for review</p>
    <p className="text-sm sm:text-base text-gray-500">Great job! You've completed all your reviews for now.</p>
  </div>
);
export default Review;
