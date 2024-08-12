## Leitner system

We have several boxes labeled from 1 to n. Box 1 is for the least known cards, while box n is the most known cards.

All cards start in box 1

- if you recall the card correctly, it moves to the next box
- otherwise, it moves back to box 1 (or stays in box 1)

the frequency of reviewing cards in each box is different, it could for example be:

- box 1: daily
- box 2: every 3 days
- box 3: weekly
- box 4: every 2 weeks
- box 5: monthly

If a card in box 5 is recalled correctly, it "graduates", and is considered a known card and is removed from the system.

## SuperMemo (SM-2)

- each card has an interval that adjusts based on how well you recall the card
- users rate their recall on a scale from 0 to 5
- after the first review, the interval is set to 1 day no matter the rating
- after the second review:
  - if rating < 3, the interval is reset to 1 day
  - if rating >= 3, the interval is set to 6 days
- after the third+ review:
  - the interval is determined by the following formula:
    `interval = interval * EF`

## Anki

Based on the SM-2 algorithm, but with some modifications:

- fuzz factor: the interval is multiplied by a random number between 0.9 and 1.1
- special handling for cards that are forgotten after having been learned, with specific steps to relearn them
