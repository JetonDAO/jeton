import { useSelector } from "@legendapp/state/react";
import { CARDS_MAP } from "@src/lib/constants/cards";
import { mockPublicCards } from "@src/lib/constants/mocks";
import { selectPublicCards$ } from "../state/selectors/gameSelectors";
import Card from "./Card";

export default function PublicCards() {
  const cards = useSelector(selectPublicCards$);

  return (
    <div className="flex">
      {cards.map((cardIndex) => {
        const cardName = CARDS_MAP[cardIndex];
        return (
          cardName && (
            <Card
              className="xl:w-24 2xl:w-[115px] animate-deal w-7 sm:w-16"
              key={cardName}
              cardName={cardName}
            />
          )
        );
      })}
    </div>
  );
}
