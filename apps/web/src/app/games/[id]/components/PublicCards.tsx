import { CARDS_MAP } from "@src/lib/constants/cards";
import Card from "./Card";

export default function PublicCards({ cards }: { cards: number[] }) {
  return (
    <div className="flex">
      {cards.map((cardIndex) => {
        const cardName = CARDS_MAP[cardIndex];
        return (
          cardName && (
            <Card
              className="xl:w-24 2xl:w-28 animate-deal w-12 sm:w-16"
              key={cardName}
              cardName={cardName}
            />
          )
        );
      })}
    </div>
  );
}
