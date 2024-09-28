import dealCardSound from "@src/assets/audio/effects/card-place.mp3";
import { useAudio } from "@src/hooks/useAudio";
import { CARDS_MAP } from "@src/lib/constants/cards";
import { useEffect, useMemo, useRef, useState } from "react";
import Card from "./Card";
export default function PrivateCards({
  playersPrivateCards,
}: {
  playersPrivateCards: Record<number /* seat number start from */, number[]>;
}) {
  const [startRevealing, setStartRevealing] = useState(false);
  const [revealedCards, setRevealedCards] = useState(false);
  const [dealedCards, setDealedCards] = useState<number[]>([]);
  const dealCardEffect = useAudio(dealCardSound, "effect");

  const mounted = useRef(false);

  const seats = useMemo(() => {
    return Object.keys(playersPrivateCards).map((seat) => Number(seat));
  }, [playersPrivateCards]);

  useEffect(() => {
    if (mounted.current) return;

    mounted.current = true;

    seats.forEach((seat, index) => {
      setTimeout(() => {
        dealCardEffect.play();
        setDealedCards((prev) => [...prev, seat]);
      }, index * 200);
    });
  }, [seats, dealCardEffect]);

  return (
    <>
      {seats.map((seat, i) => {
        return (
          <div
            className={`flex grow-0 cards shrink-0 w-max duration-700 transition-all cards-${seat} ${
              dealedCards.includes(seat) ? "" : "cards-center"
            } `}
            key={seat}
          >
            {revealedCards ? (
              <>
                {playersPrivateCards[seat]?.map(
                  (cardName, i) =>
                    CARDS_MAP[cardName] && (
                      <Card
                        className={`w-16 h-24 animate-flip-y grow-0 shrink-0 ${
                          revealedCards ? "" : ""
                        }`}
                        key={cardName}
                        cardName={CARDS_MAP[cardName]}
                      />
                    ),
                )}
              </>
            ) : (
              <div className="relative">
                <div
                  className={`w-14 h-20 rounded-lg animate-deal bg-[url("/images/card-back.png")] bg-no-repeat bg-contain justify-center grow-0 shrink-0 duration-[600ms] transition-all ${
                    revealedCards ? "" : ""
                  }`}
                  style={{
                    transform: startRevealing ? "rotateY(90deg)" : "",
                    transformStyle: "preserve-3d",
                  }}
                />
                <div
                  className={`w-14 h-20 rounded-lg animate-deal absolute bg-[url("/images/card-back.png")] bg-no-repeat bg-contain justify-center grow-0 shrink-0 duration-[600ms] left-0 top-0 transition-all ${
                    dealedCards.includes(seat) ? "!left-7" : ""
                  }`}
                  style={{
                    transform: startRevealing ? "rotateY(90deg)" : "",
                    transformStyle: "preserve-3d",
                  }}
                />
              </div>
              // <UnrevealedCards startRevealing={startRevealing} />
            )}
          </div>
        );
      })}
    </>
  );
}
