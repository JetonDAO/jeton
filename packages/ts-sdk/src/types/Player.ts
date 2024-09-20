import type { PublicKey as ElGamalPublicKey } from "@jeton/zk-deck";

export enum PlayerStatus {
  active = "active",
  folded = "folded",
  allIn = "all-in",
  sittingOut = "sitting-out",
}
export interface Player {
  id: string;
  balance: number;
  elGamalPublicKey: ElGamalPublicKey;
  status: PlayerStatus;
}
