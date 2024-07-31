interface Deck {
  id: string;
  name: string;
}

const renderDeckInfo = (decks: Deck[]) => {
  if (!decks || decks.length <= 0) {
    return null;
  }

  if (decks.length === 1) {
    return <span className="text-sm text-gray-600">From deck: {decks[0].name}</span>;
  }

  if (decks.length === 2) {
    return (
      <span className="text-sm text-gray-600">
        From decks: {decks[0].name} and {decks[1].name}
      </span>
    );
  }

  return (
    <span className="text-sm text-gray-600">
      From decks:{' '}
      {decks
        .slice(0, -1)
        .map((deck) => deck.name)
        .join(', ')}
      , and {decks[decks.length - 1].name}
    </span>
  );
};

export default renderDeckInfo;
