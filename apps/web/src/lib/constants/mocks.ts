import { type Player, PlayerStatus } from "@jeton/ts-sdk";
import { useEffect, useState } from "react";

export const mockPublicKey: Uint8Array = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

export const mockPlayers: Player[] = [
  {
    id: "player123",
    balance: 5000,
    status: PlayerStatus.active,
  },
  {
    id: "player456",
    balance: 2500,
    status: PlayerStatus.folded,
  },
  {
    id: "player789",
    balance: 0,
    status: PlayerStatus.allIn,
  },
  {
    id: "player101",
    balance: 10000,
    status: PlayerStatus.sittingOut,
  },
  {
    id: "player123",
    balance: 5000,
    status: PlayerStatus.active,
  },
  {
    id: "player456",
    balance: 2500,
    status: PlayerStatus.folded,
  },
  {
    id: "player789",
    balance: 0,
    status: PlayerStatus.allIn,
  },
  {
    id: "player101",
    balance: 10000,
    status: PlayerStatus.sittingOut,
  },
  {
    id: "player101",
    balance: 10000,
    status: PlayerStatus.sittingOut,
  },
];

export function useMockShuffle() {
  const [dealerSeat, setDealerSeat] = useState(1);
  const [isEnded, setIsEnded] = useState(false);
  const [isStarted, setIsStarted] = useState(false);

  const start = () => {
    setIsStarted(true);
    setIsEnded(false);
  };

  useEffect(() => {
    if (!isStarted) return;

    const timeout = setTimeout(() => {
      const dealerInterval = setInterval(() => {
        setDealerSeat((prevSeat) => {
          if (prevSeat < 9) {
            return prevSeat + 1;
          }

          clearInterval(dealerInterval);
          setIsEnded(true);
          return 1;
        });
      }, 3000);

      return () => clearInterval(dealerInterval);
    }, 2000);

    return () => clearTimeout(timeout);
  }, [isStarted]);

  return { dealerSeat, isEnded, start };
}
