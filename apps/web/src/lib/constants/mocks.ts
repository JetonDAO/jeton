import { BettingActions, PlayerStatus } from "@jeton/ts-sdk";
import type { UIPlayer } from "@src/app/games/[id]/state/state";
import { useEffect, useState } from "react";

export const mockPublicKey: Uint8Array = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

export const mockPublicCards = [2, 51, 45, 33, 21];

export const mockMyCards = [51, 49];

export const mockPrivateCards: Record<number, number[]> = {
  1: [1, 2],
  2: [1, 2],
  3: [3, 4],
  4: [5, 6],
  5: [3, 4],
  6: [5, 6],
  7: [3, 4],
  8: [5, 6],
  9: [5, 6],
};

export const mockPlayers: UIPlayer[] = [
  {
    id: "player124124123",
    balance: 5000,
    status: PlayerStatus.active,
    roundAction: {
      action: BettingActions.CALL,
      amount: 420,
    },
  },
  {
    id: "player431256",
    balance: 2500,
    status: PlayerStatus.folded,
    roundAction: {
      action: BettingActions.FOLD,
      amount: 420,
    },
  },
  {
    id: "player7123489",
    balance: 0,
    status: PlayerStatus.allIn,
    winAmount: 420,
  },
  {
    id: "player1012444211",
    balance: 10000,
    status: PlayerStatus.sittingOut,
  },
  {
    id: "player12332",
    balance: 5000,
    status: PlayerStatus.active,
    roundAction: {
      action: BettingActions.RAISE,
      amount: 420,
    },
  },
  {
    id: "player456123123",
    balance: 2500,
    status: PlayerStatus.folded,
  },
  {
    id: "player783123131239",
    balance: 0,
    status: PlayerStatus.allIn,
    winAmount: 420,
  },
  {
    id: "player103123123124141",
    balance: 10000,
    status: PlayerStatus.sittingOut,
    roundAction: {
      action: BettingActions.CHECK,
      amount: 420,
    },
  },
  {
    id: "player1313212301",
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
