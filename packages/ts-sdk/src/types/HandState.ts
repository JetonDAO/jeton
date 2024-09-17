import type { AggregatedPublicKey, EncryptedDeck } from "@jeton/zk-deck";
import type { CardShareProofSource } from "@src/CardShareProofSource";
import type { BettingRound } from "./Betting";
import type { Player } from "./Player";

export interface HandState {
  pot: number[];
  foldedPlayers: Player[];
  // this array is sorted based on the amount of bets in increasing order
  allIns: Player[];
  aggregatedPublicKey?: AggregatedPublicKey;
  privateCardShareProofs?: CardShareProofSource;
  finalOutDeck?: EncryptedDeck;
  bettingRound?: BettingRound;
}
