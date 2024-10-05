import { GameStatus, type Player } from "@jeton/ts-sdk";
import { useSelector } from "@legendapp/state/react";
import Avatar1 from "@src/assets/images/avatars/avatar-1.png";
import Avatar2 from "@src/assets/images/avatars/avatar-2.png";
import Avatar3 from "@src/assets/images/avatars/avatar-3.png";
import Avatar4 from "@src/assets/images/avatars/avatar-4.png";
import { CARDS_MAP } from "@src/lib/constants/cards";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  selectAwaitingBetFrom$,
  selectDealer$,
  selectGameStatus$,
  selectMyCards$,
  selectShufflingPlayer$,
} from "../state/selectors/gameSelectors";
import Card from "./Card";
import DealerBadge from "./DealerBadge";

export default function Seat({
  player,
  seatNumber,
}: {
  player: Player;
  seatNumber: number;
}) {
  const avatars = [Avatar1, Avatar2, Avatar3, Avatar4];
  const mounted = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const randomAvatar = useMemo(
    () => avatars[Math.floor(Math.random() * avatars.length)],
    [seatNumber],
  );
  const shufflingPlayer = useSelector(selectShufflingPlayer$());
  const awaitingBetFrom = useSelector(selectAwaitingBetFrom$());
  const isPlayerTurn = awaitingBetFrom?.id === player.id;
  const myCards = useSelector(selectMyCards$());
  const dealer = useSelector(selectDealer$());

  const gameStatus = useSelector(selectGameStatus$());
  const [lastAction, setLastAction] = useState("");

  useEffect(() => {
    if (mounted.current) return;

    mounted.current = true;
  }, []);

  useEffect(() => {
    if (
      gameStatus === GameStatus.DrawRiver ||
      gameStatus === GameStatus.DrawFlop ||
      gameStatus === GameStatus.DrawTurn
    ) {
      setLastAction("");
    }
  }, [gameStatus]);

  return (
    <div
      className={`seat-position items-center flex z-30 shrink-0  md:w-28 xl:w-32 w-10 grow-0 flex-col duration-1000 ${
        shufflingPlayer?.id === player.id
          ? "seat-dealer scale-110"
          : `seat-${seatNumber} ${2 > Math.random() ? "z-[501]" : ""}`
      }`}
      style={{ animationDelay: `${seatNumber * 100 + 100}ms` }}
    >
      <Image
        draggable={false}
        src={randomAvatar ?? ""}
        alt="avatar"
        className={`w-full aspect-square animate-grow-in grow-0 sm:w-14 rounded-full shrink-0 border-2 md:border-8 ${
          shufflingPlayer?.id === player.id ? "scale-125 animate-bounce delay-1000" : ""
        } ${isPlayerTurn ? "ring-8 ring-blue-600 duration-500" : ""}`}
        style={{
          transitionDelay: mounted.current ? "0ms" : `${150 * seatNumber}ms`,
        }}
      />
      {lastAction && (
        <div className="nes-balloon from-left z-50 animate-grow-in origin-bottom-left absolute -right-24 h-12 w-32 text-center !p-0">
          <p className="text-sm">{lastAction}</p>
        </div>
      )}
      {dealer?.id === player.id && <DealerBadge />}

      {seatNumber === 1 && myCards && myCards.length > 0 && (
        <div className="justify-center flex absolute shrink-0 -right-[200%] bottom-0">
          {myCards?.map(
            (cardName, i) =>
              CARDS_MAP[cardName] && (
                <Card
                  className={
                    i === 0 ? "animate-dealAndRotate1" : "animate-dealAndRotate2 relative right-14"
                  }
                  key={cardName}
                  cardName={CARDS_MAP[cardName]}
                />
              ),
          )}
        </div>
      )}
      <div className="bg-[#b87d5b] shrink-0 flex-col rounded-sm line-clamp-1 relative flex justify-center text-[8px] text-white text-center shadow-2xl md:text-sm px-1 bg-opacity-80">
        <span>{player.id.slice(2, 8)} </span> <span>${player.balance}</span>
      </div>
    </div>
  );
}
