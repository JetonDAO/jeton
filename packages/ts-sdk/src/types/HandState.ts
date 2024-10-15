import type { AggregatedPublicKey, EncryptedDeck } from "@jeton/zk-deck";
import type { BettingManager } from "@src/Game/BettingManager";
import type { CardShareProofSource } from "@src/Game/CardShareProofSource";

export interface HandState {
  pot: number[];
  aggregatedPublicKey?: AggregatedPublicKey;
  privateCardShareProofs?: CardShareProofSource;
  finalOutDeck?: EncryptedDeck;
  bettingManager?: BettingManager;
}
