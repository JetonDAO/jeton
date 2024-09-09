import type { Groth16Proof } from "snarkjs";

import { numCards } from "./constants.js";
import {
  proveDecryptCardShare,
  verifyDecryptCardShare,
} from "./decrypt_card_share.js";
import {
  createPermutationMatrix,
  samplePermutationVector,
} from "./permutation.js";
import {
  proveShuffleEncryptDeck,
  verifyShuffleEncryptDeck,
} from "./shuffle_encrypt_deck.js";
import {
  type TwistedEdwardsCurve,
  createJubJub,
} from "./twisted_edwards_curve.js";

export type { Groth16Proof } from "snarkjs";
export { numCards } from "./constants.js";

export type SecretKey = bigint;
export type PublicKey = [string, string];
export type AggregatedPublicKey = [string, string];

export type EncryptedCard = [string, string, string, string];
export type EncryptedDeck = EncryptedCard[];
export type DecryptionCardShare = [string, string];

export class ZKDeck {
  readonly initialEncryptedDeck: EncryptedDeck;
  constructor(
    readonly curve: TwistedEdwardsCurve,
    readonly shuffleEncryptDeckWasm: string | Uint8Array,
    readonly decryptCardShareWasm: string | Uint8Array,
    readonly shuffleEncryptDeckZkey: string | Uint8Array,
    readonly decryptCardShareZkey: string | Uint8Array,
  ) {
    this.initialEncryptedDeck = Array.from(new Array(numCards).keys()).map(
      (i) =>
        [
          ...this.curve.pointToStringTuple(this.curve.zero),
          ...this.curve.pointToStringTuple(
            this.curve.mulScalarPoint(i + 1, this.curve.generator),
          ),
        ] as EncryptedCard,
    );
  }

  public sampleSecretKey(): SecretKey {
    return this.curve.sampleScalar();
  }

  public generatePublicKey(secretKey: SecretKey): PublicKey {
    const p = this.curve.mulScalarPoint(secretKey, this.curve.generator);
    return [this.curve.field.toString(p[0]), this.curve.field.toString(p[1])];
  }

  public generateAggregatedPublicKey(
    publicKeys: PublicKey[],
  ): AggregatedPublicKey {
    const p = publicKeys.reduce(
      (acc, pk) => this.curve.addPoints(acc, this.curve.point(pk)),
      this.curve.zero,
    );
    return this.curve.pointToStringTuple(p);
  }

  public async proveShuffleEncryptDeck(
    aggregatedPublicKey: AggregatedPublicKey,
    inputDeck: EncryptedDeck,
    permutationVector?: number[],
    randomVector?: bigint[],
  ): Promise<{ proof: Groth16Proof; outputDeck: EncryptedDeck }> {
    const permutationMatrix = createPermutationMatrix(
      permutationVector || samplePermutationVector(numCards),
    );
    return proveShuffleEncryptDeck(
      permutationMatrix,
      aggregatedPublicKey,
      randomVector ||
        new Array(numCards)
          .fill(undefined)
          .map((_) => this.curve.sampleScalar()),
      inputDeck,
      this.shuffleEncryptDeckWasm,
      this.shuffleEncryptDeckZkey,
    );
  }

  public async verifyShuffleEncryptDeck(
    aggregatedPublicKey: AggregatedPublicKey,
    inputDeck: EncryptedDeck,
    outputDeck: EncryptedDeck,
    proof: Groth16Proof,
  ): Promise<boolean> {
    return verifyShuffleEncryptDeck(
      aggregatedPublicKey,
      inputDeck,
      outputDeck,
      proof,
    );
  }

  public async proveDecryptCardShare(
    secretKey: SecretKey,
    cardIndex: number,
    deck: EncryptedDeck,
  ): Promise<{
    proof: Groth16Proof;
    decryptionCardShare: DecryptionCardShare;
  }> {
    const publicKey = this.generatePublicKey(secretKey);
    const inputPoint = deck[cardIndex]?.slice(0, 2) as [string, string];
    const { proof, outputPoint } = await proveDecryptCardShare(
      secretKey,
      publicKey,
      inputPoint,
      this.decryptCardShareWasm,
      this.decryptCardShareZkey,
    );
    return { proof, decryptionCardShare: outputPoint };
  }

  public async verifyDecryptCardShare(
    publicKey: PublicKey,
    cardIndex: number,
    deck: EncryptedDeck,
    decryptCardShare: DecryptionCardShare,
    proof: Groth16Proof,
  ): Promise<boolean> {
    const inputPoint = deck[cardIndex]?.slice(0, 2) as [string, string];
    return verifyDecryptCardShare(
      publicKey,
      inputPoint,
      decryptCardShare,
      proof,
    );
  }

  public decryptCard(
    cardIndex: number,
    deck: EncryptedDeck,
    decryptCardShares: DecryptionCardShare[],
  ): number {
    const sum = decryptCardShares.reduce(
      (acc, ds) => this.curve.addPoints(acc, this.curve.point(ds)),
      this.curve.zero,
    );
    const result = this.curve.pointToStringTuple(
      this.curve.addPoints(
        this.curve.point(deck[cardIndex]?.slice(2, 4) as [string, string]),
        this.curve.negPoint(sum),
      ),
    );
    return this.initialEncryptedDeck.findIndex(
      (card) => card[2] === result[0] && card[3] === result[1],
    );
  }
}

export async function createZKDeck(
  shuffleEncryptDeckWasm: string | Uint8Array,
  decryptCardShareWasm: string | Uint8Array,
  shuffleEncryptDeckZkey: string | Uint8Array,
  decryptCardShareWasmZkey: string | Uint8Array,
): Promise<ZKDeck> {
  const curve = await createJubJub();
  return new ZKDeck(
    curve,
    shuffleEncryptDeckWasm,
    decryptCardShareWasm,
    shuffleEncryptDeckZkey,
    decryptCardShareWasmZkey,
  );
}
