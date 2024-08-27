"use client";

import Avatar1 from "@src/assets/images/avatars/avatar-1.png";
import Avatar2 from "@src/assets/images/avatars/avatar-2.png";
import Avatar3 from "@src/assets/images/avatars/avatar-3.png";
import Avatar4 from "@src/assets/images/avatars/avatar-4.png";
import TableBackground from "@src/assets/images/table.png";
import { GameProvider, useGame } from "@src/providers/GameProvider";
import type { CardName } from "@src/types";
import { loadCardImage } from "@src/utils/cardLoader";
import Image, { type StaticImageData } from "next/image";
import { type ReactNode, useEffect, useState } from "react";

type PlayerInfo = {
  name: string;
  seat: number;
  avatar: StaticImageData;
};

const players: PlayerInfo[] = [
  {
    name: "Akbar",
    seat: 1,
    avatar: Avatar1,
  },
  {
    name: "Rick",
    seat: 2,
    avatar: Avatar2,
  },
  {
    name: "Ahmad",
    seat: 3,
    avatar: Avatar3,
  },
  {
    name: "Ali",
    seat: 4,
    avatar: Avatar2,
  },
  {
    name: "Mamad",
    seat: 5,
    avatar: Avatar4,
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
        className="h-full w-full object-contain -z-40 scale-125"
        src={TableBackground}
        alt="table"
      />
      {children}
      <div className="flex absolute top-[35%]">
        {cardsOnTable.map((cardName) => (
          <Card key={cardName} cardName={cardName} />
        ))}
      </div>
    </div>
  );
}

function Player({ info }: { info: PlayerInfo }) {
  const { currentPlayer } = useGame();
  const { seat, avatar, name } = info;

  return (
    <div className={`player-position player-${seat}`}>
      <Image
        src={avatar}
        alt="avatar"
        className={`w-[150px] h-[150px] rounded-full ${
          currentPlayer === seat ? "border-8 border-green-500" : ""
        }`}
      />
      <div className="bg-[#635b45] text-white text-center rounded-sm shadow-2xl text-sm">
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
          className="bg-[#635b45] py-3 px-6 hover:brightness-90 text-white border-2 border-[#3a3526]"
          key={action}
        >
          {action}
        </button>
      ))}
    </div>
  );
}

function Card({ cardName }: { cardName: CardName }) {
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

  if (!cardSrc) {
    return <p>Card image not found!</p>;
  }

  return (
    <Image
      src={cardSrc}
      alt={cardName}
      className="scale-50 lg:scale-75 2xl:scale-100"
    />
  );
}
