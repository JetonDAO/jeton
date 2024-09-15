import type { Player } from "@jeton/ts-sdk";
import { state$ } from "../state";

export function newPlayerCheckedInHandler(player: Player) {
  const gameState$ = state$.gameState;
  if (!gameState$.get()) throw new Error("game must exist in state");
  gameState$.players.push(player);
}
