import dealCardSound from "@src/assets/audio/effects/card-place.mp3";
import { useAudio } from "@src/hooks/useAudio";
import { CARDS_MAP } from "@src/lib/constants/cards";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Card from "./Card";

export default function PrivateCards({
  playersPrivateCards,
}: {
  playersPrivateCards: Record<number /* seat number start from */, number[]> | null;
}) {
  const [receivedCards, setReceivedCards] = useState(true);
  const [revealedCards, setRevealedCards] = useState(false);
  const [dealCards, setDealCards] = useState<number[]>([]);
  const dealCardEffect = useAudio(dealCardSound, "effect");

  const mounted = useRef(false);

  const seats = useMemo(() => {
    return playersPrivateCards ? Object.keys(playersPrivateCards).map((seat) => Number(seat)) : [];
  }, [playersPrivateCards]);

  useEffect(() => {
    if (mounted.current || seats.length === 0) return;

    mounted.current = true;

    seats.forEach((seat, index) => {
      if (seat === 1) return;

      setTimeout(async () => {
        await dealCardEffect.play();
        setDealCards((prev) => [...prev, seat]);
      }, index * 200);
    });
  }, [seats, dealCardEffect]);

  useEffect(() => {
    setTimeout(() => {
      setRevealedCards(true);
    }, 3000);
  }, []);

  return (
    <>
      {seats.map((seat, i) => {
        if (seat === 1) return;

        return (
          <div
            className={`flex grow-0 cards shrink-0 w-max duration-700 transition-all ${
              dealCards.includes(seat) ? `cards-${seat}` : "cards-center"
            } `}
            key={seat}
          >
            {revealedCards && playersPrivateCards ? (
              <>
                {playersPrivateCards[seat]?.map(
                  (cardName, i) =>
                    CARDS_MAP[cardName] && (
                      <Card
                        className={`sm:w-[72px] w-5 animate-flip-y grow-0 shrink-0 ${
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
                  className={`sm:w-14 sm:h-20 w-5 h-8 rounded-lg animate-deal bg-[url("/images/card-back.png")] bg-no-repeat bg-contain justify-center grow-0 shrink-0 duration-[600ms] transition-all ${
                    revealedCards ? "" : ""
                  }`}
                  style={{
                    transform: receivedCards ? "rotateY(90deg)" : "",
                    transformStyle: "preserve-3d",
                  }}
                />
                <div
                  className={`sm:w-14 sm:h-20 w-5 h-8 rounded-lg animate-deal absolute bg-[url("/images/card-back.png")] bg-no-repeat bg-contain justify-center grow-0 shrink-0 duration-[600ms] left-0 top-0 transition-all ${
                    dealCards.includes(seat) ? "sm:!left-7 !left-2" : ""
                  }`}
                  style={{
                    transform: receivedCards ? "rotateY(90deg)" : "",
                    transformStyle: "preserve-3d",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
