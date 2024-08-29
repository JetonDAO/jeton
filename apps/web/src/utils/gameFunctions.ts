import type { CardName } from "@src/types";

export function dealCards(
  allCards: CardName[],
  addCardToTable: (card: CardName) => void,
  delay = 1000,
) {
  let cardIndex = 0;

  const interval = setInterval(() => {
    if (cardIndex < allCards.length) {
      const newCard = allCards[cardIndex];
      if (!newCard) return;
      addCardToTable(newCard);
      cardIndex++;
    } else {
      clearInterval(interval);
    }
  }, delay);
}

export function playSound(soundFile: string) {
  const audio = new Audio(soundFile);
  audio.play();
}
