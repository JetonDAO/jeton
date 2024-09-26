import type { GameStatus } from "./GameStatus";

export interface WholeGameState {
  dealerIndex: number;
  // in seconds
  timeOut: number;
  gameStatus: GameStatus;
}
