import type { GameStatus } from "./GameStatus";
import type { Player } from "./Player";

export interface GameState {
  players: Player[];
  dealer: number;
  status: GameStatus;
}
