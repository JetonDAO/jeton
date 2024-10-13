import { GameStatus, type Player, PlayerStatus } from "@jeton/ts-sdk";
import { useSelector } from "@legendapp/state/react";
import Avatar1 from "@src/assets/images/avatars/avatar-1.png";
import Avatar2 from "@src/assets/images/avatars/avatar-2.png";
import Avatar3 from "@src/assets/images/avatars/avatar-3.png";
import Avatar4 from "@src/assets/images/avatars/avatar-4.png";
import Avatar5 from "@src/assets/images/avatars/avatar-5.png";
import Avatar6 from "@src/assets/images/avatars/avatar-6.png";
import Avatar7 from "@src/assets/images/avatars/avatar-7.png";
import Avatar8 from "@src/assets/images/avatars/avatar-8.png";
import Avatar9 from "@src/assets/images/avatars/avatar-9.png";
import Avatar10 from "@src/assets/images/avatars/avatar-10.png";
import WinnerStuff from "@src/assets/images/champagne-pixel-animated.gif";
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

function hashPlayerIDToAvatar(id: string, avatarCount: number) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % avatarCount);
}

export default function Seat({
  player,
  seatNumber,
}: {
  player: Player;
  seatNumber: number;
}) {
  const avatars = [
    Avatar1,
    Avatar2,
    Avatar3,
    Avatar4,
    Avatar5,
    Avatar6,
    Avatar7,
    Avatar8,
    Avatar9,
    Avatar10,
  ];
  const mounted = useRef(false);

  // Hash the player ID to consistently pick an avatar
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const playerAvatarIndex = useMemo(() => {
    return hashPlayerIDToAvatar(player.id, avatars.length);
  }, [player.id]);

  const playerAvatar = avatars[playerAvatarIndex];

  const shufflingPlayer = useSelector(selectShufflingPlayer$());
  const awaitingBetFrom = useSelector(selectAwaitingBetFrom$());
  const isPlayerTurn = awaitingBetFrom?.id === player.id;
  const myCards = useSelector(selectMyCards$());
  const dealer = useSelector(selectDealer$());

  const gameStatus = useSelector(selectGameStatus$());
  const [lastAction, setLastAction] = useState("");
  const isWinner = false;

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
          : `seat-${seatNumber} ${2 > Math.random() ? "z-[501]" : ""} ${
              player.status === PlayerStatus.sittingOut ? "opacity-80" : ""
            }`
      }`}
      style={{ animationDelay: `${seatNumber * 100 + 100}ms` }}
    >
      <Image
        draggable={false}
        src={playerAvatar ?? ""}
        alt="avatar"
        className={`w-full aspect-square object-contain bg-black/70 h-full animate-grow-in grow-0 sm:w-14 rounded-full shrink-0 border-2 md:border-8 ${
          shufflingPlayer?.id === player.id ? "scale-125 animate-bounce delay-1000" : ""
        } ${isPlayerTurn ? "ring-8 animate-bounce ring-blue-600 duration-500" : ""} ${
          player.status === PlayerStatus.sittingOut || player.status === PlayerStatus.folded
            ? "scale-95"
            : ""
        } ${isWinner ? "animate-tada" : ""}`}
        style={{
          transitionDelay: mounted.current ? "0ms" : `${150 * seatNumber}ms`,
        }}
      />
      {isWinner && (
        <Image
          className={`absolute top-0 -right-14 animate-grow-in ${isWinner ? "animate-tada" : ""}`}
          alt="chicken winner"
          src={WinnerStuff}
        />
      )}

      {(lastAction || player.status === PlayerStatus.folded) && (
        <div className="nes-balloon from-left z-50 animate-grow-in origin-bottom-left absolute top-0 -right-20 text-center p-2 sm:p-2">
          <p className="text-[8px] sm:text-sm">
            {player.status === PlayerStatus.folded ? "Folded" : lastAction}
          </p>
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
      <div className="bg-black/70 shrink-0 flex-col rounded-sm line-clamp-1 relative flex justify-center text-[8px] text-white text-center shadow-2xl md:text-sm px-1 ">
        <span>{player.id.slice(2, 8)} </span> <span>${player.balance}</span>
      </div>
    </div>
  );
}
