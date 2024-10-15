import { GameStatus, PlayerStatus } from "@jeton/ts-sdk";
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
import Chip from "@src/assets/images/chips/chip.png";
import Image, { type StaticImageData } from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  selectAwaitingBetFrom$,
  selectDealer$,
  selectGamePlayers$,
  selectGameStatus$,
  selectShufflingPlayer$,
} from "../state/selectors/gameSelectors";
import type { UIPlayer } from "../state/state";
import DealerBadge from "./DealerBadge";

// Define the avatars array as a constant
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

// Function to assign unique avatars to players
function assignUniqueAvatars(players: (UIPlayer | null)[]): Record<string, StaticImageData> {
  const availableAvatars = [...avatars];
  const assignedAvatars: Record<string, StaticImageData> = {};

  players.forEach((player) => {
    if (!player) return;
    if (!assignedAvatars[player.id]) {
      const avatarIndex = hashPlayerIDToAvatar(player.id, availableAvatars.length);

      const assignedAvatar = availableAvatars[avatarIndex];

      assignedAvatars[player.id] = assignedAvatar ?? Avatar1;

      availableAvatars.splice(avatarIndex, 1);
    }
  });

  return assignedAvatars;
}

// Function to hash player IDs and assign avatar
function hashPlayerIDToAvatar(id: string, avatarCount: number): number {
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
  player: UIPlayer;
  seatNumber: number;
}) {
  const mounted = useRef(false);

  // Selectors from the state
  const players = useSelector(selectGamePlayers$());
  const shufflingPlayer = useSelector(selectShufflingPlayer$());
  const awaitingBetFrom = useSelector(selectAwaitingBetFrom$());
  const isPlayerTurn = awaitingBetFrom?.id === player.id;
  const dealer = useSelector(selectDealer$());
  const gameStatus = useSelector(selectGameStatus$());

  const [lastAction, setLastAction] = useState<string>("");
  const isWinner = player.winAmount && player.winAmount > 0;

  // Use `useMemo` to assign avatars
  const assignedAvatars = useMemo(() => (players ? assignUniqueAvatars(players) : {}), [players]);
  const playerAvatar = assignedAvatars[player.id] ?? Avatar1;

  const isMainPlayerCards = useMemo(() => {
    return seatNumber === 1;
  }, [seatNumber]);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
  }, []);

  // Reset last action based on game status
  useEffect(() => {
    console.log("status: ", gameStatus);

    if (
      gameStatus === GameStatus.DrawRiver ||
      gameStatus === GameStatus.DrawFlop ||
      gameStatus === GameStatus.DrawTurn ||
      isPlayerTurn
    ) {
      setLastAction("");
    }
  }, [gameStatus, isPlayerTurn]);

  // Update last action for the player
  useEffect(() => {
    if (player.roundAction) {
      const { action, amount } = player.roundAction;
      setLastAction(`${action} ${amount}`);
    }
  }, [player.roundAction]);

  return (
    <div
      className={`seat-position items-center flex z-30 shrink-0 md:w-28 xl:w-36 w-6 grow-0 duration-1000 ${
        shufflingPlayer?.id === player.id
          ? "seat-dealer scale-110"
          : `seat-${seatNumber} ${player.status === PlayerStatus.sittingOut ? "opacity-80" : ""}`
      }`}
      style={{ animationDelay: `${seatNumber * 100 + 100}ms` }}
    >
      <div
        className={`flex flex-col items-center duration-500 ${
          isMainPlayerCards ? "-translate-x-5" : ""
        }`}
      >
        <Image
          draggable={false}
          src={playerAvatar} // playerAvatar is always a valid image
          alt="avatar"
          className={`aspect-square object-contain bg-black/70 h-full animate-grow-in grow-0 rounded-full shrink-0 border-2 md:border-8 ${
            shufflingPlayer?.id === player.id ? "scale-125 animate-bounce delay-1000" : ""
          } ${isPlayerTurn ? "ring-8 animate-bounce ring-amber-600 duration-500" : ""} ${
            player.status === PlayerStatus.sittingOut || player.status === PlayerStatus.folded
              ? "scale-95"
              : ""
          } ${isWinner ? "animate-tada" : ""}`}
          style={{
            transitionDelay: mounted.current ? "0ms" : `${150 * seatNumber}ms`,
          }}
        />
        <div className="bg-black/70 shrink-0 flex-col sm:border border-amber-300 rounded-sm line-clamp-1 relative flex justify-center text-[6px] text-white text-center shadow-2xl md:text-sm px-1 divide-y divide-white/50">
          <span>{seatNumber === 1 ? "me" : player.id.slice(2, 8)}</span>
          <span className="flex items-center justify-center">
            <Image src={Chip} alt="chip" className="w-6 sm:block hidden" />
            {player.balance}
          </span>
        </div>
      </div>

      {isWinner && (
        <Image
          className={`absolute top-0 -right-5 sm:-right-14 animate-grow-in ${
            isWinner ? "animate-tada" : ""
          }`}
          alt="winner badge"
          src={WinnerStuff}
        />
      )}

      {lastAction && (
        <>
          <div className="nes-balloon hidden sm:block sm:absolute from-left z-50 animate-grow-in origin-bottom-left left-20 bottom-32 max-w-32 w-full self-center text-center p-2 sm:p-2">
            <p className="text-[8px] sm:text-sm">
              {player.status === PlayerStatus.folded ? "Folded" : lastAction}
            </p>
          </div>
          <div
            className={`bg-black/70 sm:hidden absolute z-50 animate-grow-in top-[40%] text-center ${
              seatNumber > 5 ? "right-0" : "left-0"
            }`}
          >
            <p className="text-[6px] sm:text-sm text-amber-200 text-center">
              {player.status === PlayerStatus.folded ? "Folded" : lastAction}
            </p>
          </div>
        </>
      )}

      {dealer?.id === player.id && <DealerBadge />}
    </div>
  );
}
