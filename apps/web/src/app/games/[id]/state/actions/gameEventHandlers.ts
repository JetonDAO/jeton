import {
  GameStatus,
  type HandStartedEvent,
  type Player,
  type playerShufflingEvent,
} from "@jeton/ts-sdk";
import { state$ } from "../state";

export function newPlayerCheckedInHandler(player: Player) {
  const gameState$ = state$.gameState;
  if (!gameState$.get()) throw new Error("game must exist in state");
  gameState$.players.push(player);
}

export function handStartedHandler({ dealer }: HandStartedEvent) {
  const gameState$ = state$.gameState;
  gameState$.dealer.set(dealer);
  gameState$.status.set(GameStatus.Shuffle);
}

export function playerShufflingHandler(player: playerShufflingEvent) {
  state$.gameState.shufflingPlayer.set(player);
  state$.gameState.status.set(GameStatus.Shuffle);
}

export function privateCardsDecryptionHandler() {
  state$.gameState.status.set(GameStatus.DrawPrivateCards);
  state$.gameState.shufflingPlayer.set(undefined);
}
