import type { BetPhase, OnChainTableObject, PlayingState } from "@src/OnChainDataSource";
import { hexStringToUint8Array } from "@src/utils/unsignedInt";
import { PublicCardRounds } from "..";

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

export function getPrivateCardsIndexes(tableObject: OnChainTableObject, playerId: string) {
  const playerPosition = tableObject.roster.players.findIndex((p) => p.addr === playerId);
  if (playerPosition === -1) throw new Error("player does not exist");
  return [playerPosition * 2, playerPosition * 2 + 1] as const;
}

export function getDeck(tableObject: OnChainTableObject) {
  return (
    tableObject.state.__variant__ === "Playing" && hexStringToUint8Array(tableObject.state.deck)
  );
}

export function getCardShares(tableObject: OnChainTableObject, indexes: number): Uint8Array;
export function getCardShares(tableObject: OnChainTableObject, indexes: number[]): Uint8Array[];
export function getCardShares(tableObject: OnChainTableObject, indexes: number | number[]) {
  if (tableObject.state.__variant__ !== "Playing") throw new Error("must be playing");
  const arrayedShares = new Array(52);
  const mapShares = tableObject.state.decryption_card_shares.data;
  for (const mapShare of mapShares) {
    arrayedShares[mapShare.key] = mapShare.value;
  }

  if (!Array.isArray(indexes)) return hexStringToUint8Array(arrayedShares[indexes]!);

  return indexes.map((cardIndex) => hexStringToUint8Array(arrayedShares[cardIndex]));
}

export function getCardIndexes(tableObject: OnChainTableObject, round: PublicCardRounds) {
  const numOfPlayer = tableObject.roster.players.length;
  const beforeFirstIndex = numOfPlayer * 2;
  if (round === PublicCardRounds.FLOP)
    return [beforeFirstIndex + 1, beforeFirstIndex + 2, beforeFirstIndex + 3];
  if (round === PublicCardRounds.TURN) return [beforeFirstIndex + 4];
  if (round === PublicCardRounds.RIVER) return [beforeFirstIndex + 5];
  throw new Error("unreachable code");
}

export function getPlayerByIndex(tableObject: OnChainTableObject, index: number) {
  return tableObject.roster.players[index];
}

export function getPlayerByAddress(tableObject: OnChainTableObject, address: string) {
  return [...tableObject.roster.players, ...tableObject.roster.waitings].find(
    (player) => player.addr === address,
  );
}

export function getBettingPlayer(tableObject: OnChainTableObject) {
  if (tableObject.state.__variant__ !== "Playing") return null;
  if (
    ["BetPreFlop", "BetFlop", "BetTurn", "BetRiver"].includes(tableObject.state.phase.__variant__)
  ) {
    return getPlayerByIndex(tableObject, (tableObject.state.phase as BetPhase).turn_index)!;
  }

  return null;
}

export function getSmallBlindPlayer(tableObject: OnChainTableObject) {
  if (tableObject.state.__variant__ !== "Playing") throw new Error("must exist");
  return getPlayerByIndex(tableObject, tableObject.roster.small_index)!;
}

export function getBigBlindPlayer(tableObject: OnChainTableObject) {
  if (tableObject.state.__variant__ !== "Playing") throw new Error("must exist");
  const numOfPlayers = tableObject.roster.players.length;
  return getPlayerByIndex(tableObject, (tableObject.roster.small_index + 1) % numOfPlayers)!;
}

export function getPot(tableObject: OnChainTableObject) {
  return tableObject.roster.players.reduce((pot, player) => pot + Number(player.bet._0), 0);
}

export function getNumberOfRaisesLeft(tableObject: OnChainTableObject) {
  if (tableObject.state.__variant__ !== "Playing") return 0;
  const phase = tableObject.state.phase;
  if (!["BetPreFlop", "BetFlop", "BetTurn", "BetRiver"].includes(phase.__variant__)) {
    return 0;
  }
  return (phase as BetPhase).raises_left;
}
