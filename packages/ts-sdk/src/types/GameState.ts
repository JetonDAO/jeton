import type { GameStatus } from "./GameStatus";
import type { Player } from "./Player";

export interface EntryGameState {
  players: Player[];
  dealer: number;
  status?: GameStatus;
}

export interface GameState {
  players: Player[];
  dealer: Player;
  status?: GameStatus;
  shufflingPlayer?: Player;
}
