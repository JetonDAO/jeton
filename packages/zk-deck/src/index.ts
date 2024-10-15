import { type Bls12381, buildBls12381 } from "ffjavascript";
import type { Groth16Proof } from "snarkjs";

import { numCards } from "./constants.js";
import { proveDecryptCardShare, verifyDecryptCardShare } from "./decrypt_card_share.js";
import { JubJub } from "./jubjub.js";
import { createPermutationMatrix, samplePermutationVector } from "./permutation.js";
import { proveShuffleEncryptDeck, verifyShuffleEncryptDeck } from "./shuffle_encrypt_deck.js";

export {
  decryptCardShareZkey,
  shuffleEncryptDeckZkey,
  numCards,
} from "./constants.js";
export type SecretKey = bigint;
export type PublicKey = Uint8Array;
export type AggregatedPublicKey = Uint8Array;
export type Proof = Uint8Array;
export type EncryptedCard = Uint8Array;
export type EncryptedDeck = Uint8Array;
export type DecryptionCardShare = Uint8Array;

export class ZKDeck {
  readonly jubjub: JubJub;
  readonly initialEncryptedDeck: EncryptedDeck;
  constructor(
    readonly bls12381: Bls12381,
    readonly shuffleEncryptDeckWasm: string | Uint8Array,
    readonly decryptCardShareWasm: string | Uint8Array,
    readonly shuffleEncryptDeckZkey: string | Uint8Array,
    readonly decryptCardShareZkey: string | Uint8Array,
  ) {
    this.jubjub = new JubJub(bls12381.Fr);
    this.initialEncryptedDeck = new Uint8Array(numCards * 128);
    for (let i = 0; i < numCards; i++) {
      this.jubjub.serialize(this.initialEncryptedDeck, i * 128, this.jubjub.zero);
      this.jubjub.serialize(
        this.initialEncryptedDeck,
        i * 128 + 64,
        this.jubjub.mulScalarPoint(i + 1, this.jubjub.generator),
      );
    }
  }

  public sampleSecretKey(): SecretKey {
    return this.jubjub.sampleScalar();
  }

  public generatePublicKey(secretKey: SecretKey): PublicKey {
    const publicKey = this.jubjub.mulScalarPoint(secretKey, this.jubjub.generator);
    const bytes = new Uint8Array(64);
    this.jubjub.serialize(bytes, 0, publicKey);
    return bytes;
  }

  public generateAggregatedPublicKey(publicKeys: PublicKey[]): AggregatedPublicKey {
    const aggregatedPublicKey = publicKeys
      .map((b) => this.jubjub.deserialize(b, 0))
      .reduce((acc, pk) => this.jubjub.addPoints(acc, pk), this.jubjub.zero);
    const bytes = new Uint8Array(64);
    this.jubjub.serialize(bytes, 0, aggregatedPublicKey);
    return bytes;
  }

  public async proveShuffleEncryptDeck(
    aggregatedPublicKey: AggregatedPublicKey,
    inputDeck: EncryptedDeck,
    permutationVector?: number[],
    randomVector?: bigint[],
  ): Promise<{ proof: Uint8Array; outputDeck: EncryptedDeck }> {
    const permutationMatrix = createPermutationMatrix(
      permutationVector || samplePermutationVector(numCards),
    );
    const { proof, outputDeck } = await proveShuffleEncryptDeck(
      permutationMatrix,
      this.jubjub.toStringTuple(this.jubjub.deserialize(aggregatedPublicKey, 0)),
      randomVector || new Array(numCards).fill(undefined).map((_) => this.jubjub.sampleScalar()),
      Array.from(new Array(numCards).keys()).map((i) => [
        ...this.jubjub.toStringTuple(this.jubjub.deserialize(inputDeck, i * 128)),
        ...this.jubjub.toStringTuple(this.jubjub.deserialize(inputDeck, i * 128 + 64)),
      ]),
      this.shuffleEncryptDeckWasm,
      this.shuffleEncryptDeckZkey,
    );
    const deckBytes = new Uint8Array(numCards * 128);
    outputDeck.map((ss, i) => {
      this.jubjub.serialize(deckBytes, i * 128, this.jubjub.fromStringTuple([ss[0], ss[1]]));
      this.jubjub.serialize(deckBytes, i * 128 + 64, this.jubjub.fromStringTuple([ss[2], ss[3]]));
    });
    return {
      proof: this.serializeProof(proof),
      outputDeck: deckBytes,
    };
  }

  public async verifyShuffleEncryptDeck(
    aggregatedPublicKey: AggregatedPublicKey,
    inputDeck: EncryptedDeck,
    outputDeck: EncryptedDeck,
    proof: Proof,
  ): Promise<boolean> {
    return verifyShuffleEncryptDeck(
      this.jubjub.toStringTuple(this.jubjub.deserialize(aggregatedPublicKey, 0)),
      Array.from(new Array(numCards).keys()).map((i) => [
        ...this.jubjub.toStringTuple(this.jubjub.deserialize(inputDeck, i * 128)),
        ...this.jubjub.toStringTuple(this.jubjub.deserialize(inputDeck, i * 128 + 64)),
      ]),
      Array.from(new Array(numCards).keys()).map((i) => [
        ...this.jubjub.toStringTuple(this.jubjub.deserialize(outputDeck, i * 128)),
        ...this.jubjub.toStringTuple(this.jubjub.deserialize(outputDeck, i * 128 + 64)),
      ]),
      this.deserializeProof(proof),
    );
  }

  public async proveDecryptCardShare(
    secretKey: SecretKey,
    cardIndex: number,
    deck: EncryptedDeck,
  ): Promise<{
    proof: Proof;
    decryptionCardShare: DecryptionCardShare;
  }> {
    const { proof, outputPoint } = await proveDecryptCardShare(
      secretKey,
      this.jubjub.toStringTuple(this.jubjub.mulScalarPoint(secretKey, this.jubjub.generator)),
      this.jubjub.toStringTuple(this.jubjub.deserialize(deck, cardIndex * 128)),
      this.decryptCardShareWasm,
      this.decryptCardShareZkey,
    );
    const decryptionCardShare = new Uint8Array(64);
    this.jubjub.serialize(decryptionCardShare, 0, this.jubjub.fromStringTuple(outputPoint));
    return {
      proof: this.serializeProof(proof),
      decryptionCardShare,
    };
  }

  public async verifyDecryptCardShare(
    publicKey: PublicKey,
    cardIndex: number,
    deck: EncryptedDeck,
    decryptionCardShare: DecryptionCardShare,
    proof: Proof,
  ): Promise<boolean> {
    return verifyDecryptCardShare(
      this.jubjub.toStringTuple(this.jubjub.deserialize(publicKey, 0)),
      this.jubjub.toStringTuple(this.jubjub.deserialize(deck, cardIndex * 128)),
      this.jubjub.toStringTuple(this.jubjub.deserialize(decryptionCardShare, 0)),
      this.deserializeProof(proof),
    );
  }

  public decryptCard(
    cardIndex: number,
    deck: EncryptedDeck,
    decryptCardShares: DecryptionCardShare[],
  ): number {
    const sum = decryptCardShares.reduce(
      (acc, ds) => this.jubjub.addPoints(acc, this.jubjub.deserialize(ds, 0)),
      this.jubjub.zero,
    );
    const result = new Uint8Array(64);
    this.jubjub.serialize(
      result,
      0,
      this.jubjub.addPoints(
        this.jubjub.deserialize(deck, cardIndex * 128 + 64),
        this.jubjub.negPoint(sum),
      ),
    );
    for (let i = 0; i < numCards; i++) {
      if (
        this.initialEncryptedDeck
          .slice(i * 128 + 64, i * 128 + 128)
          .every((n, j) => n === result[j])
      ) {
        return i;
      }
    }
    return -1;
  }

  serializeProof(proof: Groth16Proof): Uint8Array {
    const bytes = new Uint8Array(384);
    this.bls12381.G1.toRprUncompressed(
      bytes,
      0,
      this.bls12381.G1.fromObject(proof.pi_a.map((s) => BigInt(s))),
    );
    this.bls12381.G2.toRprUncompressed(
      bytes,
      96,
      this.bls12381.G2.fromObject(proof.pi_b.map((ss) => ss.map((s) => BigInt(s)))),
    );
    this.bls12381.G1.toRprUncompressed(
      bytes,
      288,
      this.bls12381.G1.fromObject(proof.pi_c.map((s) => BigInt(s))),
    );
    return bytes;
  }

  deserializeProof(bytes: Uint8Array): Groth16Proof {
    const a = this.bls12381.G1.toObject(this.bls12381.G1.fromRprUncompressed(bytes, 0)).map((n) =>
      n.toString(),
    );
    const b = this.bls12381.G2.toObject(this.bls12381.G2.fromRprUncompressed(bytes, 96)).map((ns) =>
      ns.map((n) => n.toString()),
    );
    const c = this.bls12381.G1.toObject(this.bls12381.G1.fromRprUncompressed(bytes, 288)).map((n) =>
      n.toString(),
    );
    return {
      pi_a: a,
      pi_b: b,
      pi_c: c,
      curve: "bls12381",
      protocol: "groth16",
    };
  }
}

export async function createZKDeck(
  shuffleEncryptDeckWasm: string | Uint8Array,
  decryptCardShareWasm: string | Uint8Array,
  shuffleEncryptDeckZkey: string | Uint8Array,
  decryptCardShareWasmZkey: string | Uint8Array,
): Promise<ZKDeck> {
  const bls12381 = await buildBls12381(true);
  return new ZKDeck(
    bls12381,
    shuffleEncryptDeckWasm,
    decryptCardShareWasm,
    shuffleEncryptDeckZkey,
    decryptCardShareWasmZkey,
  );
}
