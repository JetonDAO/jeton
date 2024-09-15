import type { AggregatedPublicKey, EncryptedDeck } from "@jeton/zk-deck";
import type { CardShareProofSource } from "@src/CardShareProofSource";

export interface HandState {
  aggregatedPublicKey?: AggregatedPublicKey;
  privateCardShareProofs?: CardShareProofSource;
  finalOutDeck?: EncryptedDeck;
}
