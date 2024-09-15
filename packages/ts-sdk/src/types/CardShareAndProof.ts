import type { DecryptionCardShare, Groth16Proof } from "@jeton/zk-deck";

export interface CardShareAndProof {
  cardIndex: number;
  proof: Groth16Proof;
  decryptionCardShare: DecryptionCardShare;
}
