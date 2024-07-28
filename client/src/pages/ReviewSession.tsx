import React from 'react';
import { useParams } from 'react-router-dom';
import Flashcard from '../components/Flashcard';
import { useReviewCard } from '../hooks/mutations/useReviewCard';
import { useAllDueCards } from '../hooks/useAllDueCards';
import { useDeckDueCards } from '../hooks/useDeckDueCards';
import renderDeckInfo from '../utils/renderDeckInfo';

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

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 max-w-4xl mx-auto">
      {isPending ? (
        <div className="text-xl text-gray-600">Loading cards...</div>
      ) : isError ? (
        <div className="text-xl text-red-600">An error occurred: {error?.message}</div>
      ) : !cards || cards.length === 0 ? (
        <div className="text-xl text-gray-600">No cards due for review</div>
      ) : (
        <>
          {!deckId ? <div className="m-2 text-sm text-gray-500">{renderDeckInfo(cards[0].decks)}</div> : null}
          <Flashcard key={cards[0].id} card={cards[0]} onReview={handleReview} />
        </>
      )}
    </div>
  );
};

export default ReviewSession;
