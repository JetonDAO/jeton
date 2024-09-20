import type { AggregatedPublicKey, EncryptedDeck } from "@jeton/zk-deck";
import type { BettingManager } from "@src/BettingManager";
import type { CardShareProofSource } from "@src/CardShareProofSource";

export interface HandState {
  pot: number[];
  aggregatedPublicKey?: AggregatedPublicKey;
  privateCardShareProofs?: CardShareProofSource;
  finalOutDeck?: EncryptedDeck;
  bettingManager?: BettingManager;
}
