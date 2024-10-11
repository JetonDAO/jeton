import type { OnChainTableObject, PlayingState } from "@src/OnChainDataSource";

export function getShufflingPlayer(tableObject: OnChainTableObject) {
  const shufflingPlayerIndex =
    tableObject.state.__variant__ === "Playing" &&
    tableObject.state.phase.__variant__ === "ShuffleEncrypt" &&
    tableObject.state.phase.turn_index;
  console.log("shuffling player index? ", shufflingPlayerIndex);
  if (shufflingPlayerIndex === false) return null;
  return tableObject.roster.players[shufflingPlayerIndex]!;
}

export function getPlayingState(tableObject: OnChainTableObject) {
  return tableObject.state as PlayingState;
}

export function isActivePlayer(tableObject: OnChainTableObject, playerId: string) {
  return !!tableObject.roster.players.find((p) => p.addr === playerId);
}
