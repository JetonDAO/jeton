import type { AggregatedPublicKey, DecryptionCardShare, EncryptedDeck } from "@jeton/zk-deck";
import type { GameStatus } from "./GameStatus";
import type { Player } from "./Player";

export type ShuffleStatusValue = { seatIndex: number };
export type DrawPrivateCardsStatusValue = {
  contributorsIndex: number[];
};
export type BetStatusValue = {
  seatIndex: number;
  numberOfRaises: number;
  lastRaiseIndex: number;
};
export interface WholeGameState {
  dealerIndex: number;
  // in seconds
  timeOut: number;
  // index of array is cardIndex in deck value is aggregated share of players
  privateCardsShares: DecryptionCardShare[];
  publicCardsShares: DecryptionCardShare[];
  gameStatus: GameStatus;
  deck?: EncryptedDeck;
  aggregatedPublicKey: AggregatedPublicKey;
  statusValue: {
    [GameStatus.Shuffle]: ShuffleStatusValue;
    [GameStatus.DrawPrivateCards]: DrawPrivateCardsStatusValue;
    [GameStatus.BetPreFlop]: BetStatusValue;
    [GameStatus.BetFlop]: BetStatusValue;
    [GameStatus.BetTurn]: BetStatusValue;
    [GameStatus.BetRiver]: BetStatusValue;
  };
  seats: Record<string, Player | undefined>;
}
