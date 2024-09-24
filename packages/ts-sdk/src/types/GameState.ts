import type { GameStatus } from "./GameStatus";
import type { Player } from "./Player";

export enum PublicCardRounds {
  FLOP = "flop",
  TURN = "turn",
  RIVER = "river",
}
export interface GameState {
  players: Player[];
  dealer: number;
  status?: GameStatus;
}
