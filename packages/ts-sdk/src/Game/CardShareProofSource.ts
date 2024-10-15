import type { CardShareAndProof, Player } from "@src/types";

export class CardShareProofSource {
  playerToProofMap: Record<string, Record<number, CardShareAndProof>>;
  constructor(players: Player[]) {
    this.playerToProofMap = {};
    for (const player of players) {
      this.playerToProofMap[player.id] = [];
    }
  }

  addProofs(playerId: string, providedProofs: CardShareAndProof[]) {
    const playerProofs = this.playerToProofMap[playerId];
    if (!playerProofs) throw new Error("player does not exist");
    for (const providedProof of providedProofs) {
      playerProofs[providedProof.cardIndex] = providedProof;
    }
  }

  receivedAllProofsFor(cardIndexes: readonly number[]) {
    for (const proofAndShares of Object.values(this.playerToProofMap)) {
      for (const cardIndex of cardIndexes) {
        if (!proofAndShares[cardIndex]) return false;
      }
    }
    return true;
  }

  getProofsFor(cardIndex: number) {
    const proofs: CardShareAndProof[] = [];
    for (const proofsAndShares of Object.values(this.playerToProofMap)) {
      const proofOfCardIndex = proofsAndShares[cardIndex];
      if (proofOfCardIndex) proofs.push(proofOfCardIndex);
    }
    return proofs;
  }
}
