import type { Player } from "./Player";
import type { GameStatus } from "./GameStatus";

export type ShuffleStatusValue = { seatIndex: number };
export type DrawPrivateCardsStatusValue = {
  contributorsIndex: number[];
};
export interface WholeGameState {
  dealerIndex: number;
  // in seconds
  timeOut: number;
  gameStatus: GameStatus;
  statusValue: WholeGameState["gameStatus"] extends GameStatus.Shuffle
    ? { seatIndex: number }
    : WholeGameState["gameStatus"] extends GameStatus.DrawPrivateCards
      ? DrawPrivateCardsStatusValue
      : null;
  seats: Record<string, Player>;
}
