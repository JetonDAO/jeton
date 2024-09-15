import type { PublicKey as ElGamalPublicKey } from "@jeton/zk-deck";

export interface Player {
  id: string;
  balance: number;
  bet?: number;
  elGamalPublicKey: ElGamalPublicKey;
}
