import type { DecryptionCardShare, Proof } from "@jeton/zk-deck";

export interface CardShareAndProof {
  cardIndex: number;
  proof: Proof;
  decryptionCardShare: DecryptionCardShare;
}
