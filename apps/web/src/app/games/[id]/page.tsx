"use client";

import Avatar1 from "@src/assets/images/avatars/avatar-1.png";
import Avatar2 from "@src/assets/images/avatars/avatar-2.png";
import Avatar3 from "@src/assets/images/avatars/avatar-3.png";
import Avatar4 from "@src/assets/images/avatars/avatar-4.png";
import Chips from "@src/assets/images/chips/chips-3-stacks.png";
import TableBackground from "@src/assets/images/table.png";
import { GameProvider, useGame } from "@src/providers/GameProvider";
import type { CardName } from "@src/types";
import { loadCardImage } from "@src/utils/cardLoader";
import { cn } from "@src/utils/cn";
import Image, { type StaticImageData } from "next/image";
import { type ReactNode, useEffect, useState } from "react";

type PlayerInfo = {
  name: string;
  seat: number;
  avatar: StaticImageData;
  chips: 20;
};

const players: PlayerInfo[] = [
  {
    name: "Akbar",
    seat: 1,
    avatar: Avatar1,
    chips: 20,
  },
  {
    name: "Rick",
    seat: 2,
    avatar: Avatar2,
    chips: 20,
  },
  {
    name: "Ahmad",
    seat: 3,
    avatar: Avatar3,
    chips: 20,
  },
  {
    name: "Ali",
    seat: 4,
    avatar: Avatar2,
    chips: 20,
  },
  {
    name: "Mamad",
    seat: 5,
    avatar: Avatar4,
    chips: 20,
  },
];

export default function PlayPage() {
  return (
    <>
      <GameProvider>
        <Table>
          {players.map((player) => (
            <Player key={player.seat} info={player} />
          ))}
        </Table>
        <PlayerActions />
      </GameProvider>
    </>
  );
}

function Table({ children }: { children: ReactNode }) {
  const { cardsOnTable } = useGame();

  return (
    <div className="flex justify-center p-20 relative -top-10">
      <Image
        priority
        className="h-full w-full object-contain -z-40 scale-125"
        src={TableBackground}
        alt="table"
      />
      {children}
      <div className="flex absolute top-[35%]">
        {cardsOnTable.map((cardName) => (
          <Card
            className="scale-50 lg:scale-75 2xl:scale-100 animate-deal"
            key={cardName}
            cardName={cardName}
          />
        ))}
      </div>
    </div>
  );
}

function Player({ info }: { info: PlayerInfo }) {
  const { currentPlayer } = useGame();
  const { seat, avatar, name, chips } = info;

  const cardsOnTable: CardName[] = ["clubs-02", "clubs-05"];

  return (
    <div className={`player-position player-${seat}`}>
      <Image
        src={avatar}
        alt="avatar"
        className={`w-[150px] h-[150px] rounded-full ${
          currentPlayer === seat ? "border-8 border-green-500" : ""
        }`}
      />
      {/* <div className="cards">cards</div> */}
      <Image className="chips w-16" src={Chips} alt="chips" />
      {seat === 1 && (
        <div className="flex justify-center absolute shrink-0 -right-[180%] bottom-0">
          {cardsOnTable.map((cardName, i) => (
            <Card
              className={
                i === 0
                  ? "animate-dealAndRotate1"
                  : "animate-dealAndRotate2 relative right-14"
              }
              key={cardName}
              cardName={cardName}
            />
          ))}
        </div>
      )}
      <div className="bg-[#9c6249] text-white text-center rounded-sm shadow-2xl text-sm">
        {name}
      </div>
    </div>
  );
}

function PlayerActions() {
  const { currentPlayer } = useGame();
  const isMainSeat = currentPlayer === 1; // main seat;

  if (!isMainSeat) return null;

  const playerAction = ["Check", "Raise", "Fold"];

  return (
    <div className="flex items-center gap-5 justify-center">
      {playerAction.map((action) => (
        <button
          className="bg-[#9c6249] py-3 px-6 hover:brightness-90 text-white border-2 border-[#3a3526]"
          key={action}
        >
          {action}
        </button>
      ))}
    </div>
  );
}

function Card({
  cardName,
  className,
}: {
  cardName: CardName;
  className?: string;
}) {
  const [cardSrc, setCardSrc] = useState<StaticImageData | null>(null);

  useEffect(() => {
    const fetchCardImage = async () => {
      try {
        const image = await loadCardImage(cardName);
        setCardSrc(image);
      } catch (error) {
        console.error(error);
        setCardSrc(null);
      }
    };

    fetchCardImage();
  }, [cardName]);

  if (!cardSrc) return null;

  return (
    <Image src={cardSrc} alt={cardName} className={cn("shrink-0", className)} />
  );
}
