import { Scalar } from "ffjavascript";
import { type Groth16Proof, groth16 } from "snarkjs";

import {
  applyPermutationVector,
  createPermutationMatrix,
  samplePermutationVector,
} from "./permutation.js";
import {
  type TwistedEdwardsCurve,
  createJubJub,
} from "./twisted_edwards_curve.js";

import decryptCardShareVerificationKey from "../dist/verification_keys/decrypt_card_share_verification_key.json" with {
  type: "json",
};
import shuffleEncryptDeckVerificationKey from "../dist/verification_keys/shuffle_encrypt_deck_verification_key.json" with {
  type: "json",
};

export const numCards = 52;

export type SecretKey = bigint;
export type PublicKey = [string, string];
export type AggregatedPublicKey = [string, string];

export type EncryptedCard = [string, string, string, string];
export type EncryptedDeck = EncryptedCard[];
export type DecryptCardShare = [string, string];

export class ZKDeck {
  readonly initialEncryptedDeck: EncryptedDeck;
  constructor(
    readonly curve: TwistedEdwardsCurve,
    readonly shuffleEncryptDeckWasm: string,
    readonly shuffleEncryptDeckZkey: string,
    readonly decryptCardShareWasm: string,
    readonly decryptCardShareZkey: string,
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

  public shuffleEncryptDeck(
    aggregatedPublicKey: AggregatedPublicKey,
    deck: EncryptedDeck,
    permutationVector?: number[],
    randomVector?: bigint[],
  ): EncryptedDeck {
    return applyPermutationVector(
      permutationVector || samplePermutationVector(numCards),
      deck,
    ).map((card, i) => {
      const r = randomVector?.at(i) || this.curve.sampleScalar();
      const c1 = this.curve.addPoints(
        this.curve.point([card[0], card[1]]),
        this.curve.mulScalarPoint(r, this.curve.generator),
      );
      const c2 = this.curve.addPoints(
        this.curve.point([card[2], card[3]]),
        this.curve.mulScalarPoint(r, this.curve.point(aggregatedPublicKey)),
      );
      return [
        ...this.curve.pointToStringTuple(c1),
        ...this.curve.pointToStringTuple(c2),
      ];
    });
  }

  public async proveShuffleEncryptDeck(
    aggregatedPublicKey: AggregatedPublicKey,
    inputDeck: EncryptedDeck,
    permutationVector?: number[],
    randomVector?: bigint[],
  ): Promise<{ proof: Groth16Proof; deck: EncryptedDeck }> {
    const permutationMatrix = createPermutationMatrix(
      permutationVector || samplePermutationVector(numCards),
    );
    const randomVectorBits = (
      randomVector ||
      new Array(numCards).fill(undefined).map((_) => this.curve.sampleScalar())
    ).map((random) => {
      const bits = Scalar.bits(random);
      return bits.concat(new Array(252 - bits.length).fill(0));
    });
    const { proof, publicSignals } = await groth16.fullProve(
      {
        permutationMatrix,
        aggregatedPublicKey,
        randomVectorBits,
        inputDeck,
      },
      this.shuffleEncryptDeckWasm,
      this.shuffleEncryptDeckZkey,
    );
    return {
      proof,
      deck: Array.from(new Array(numCards).keys()).map(
        (i) => publicSignals.slice(4 * i, 4 * i + 4) as EncryptedCard,
      ),
    };
  }

  public async verifyShuffleEncryptDeck(
    proof: Groth16Proof,
    aggregatedPublicKey: AggregatedPublicKey,
    inputDeck: EncryptedDeck,
    outDeck: EncryptedDeck,
  ): Promise<boolean> {
    return groth16.verify(
      shuffleEncryptDeckVerificationKey,
      [...outDeck.flat(), ...aggregatedPublicKey, ...inputDeck.flat()],
      proof,
    );
  }

  public decryptCardShare(
    secretKey: SecretKey,
    cardIndex: number,
    deck: EncryptedDeck,
  ): DecryptCardShare {
    const c1 = this.curve.point(
      deck[cardIndex]?.slice(0, 2) as [string, string],
    );
    return this.curve.pointToStringTuple(
      this.curve.mulScalarPoint(secretKey, c1),
    );
  }

  public async proveDecryptCardShare(
    secretKey: SecretKey,
    cardIndex: number,
    deck: EncryptedDeck,
  ): Promise<{ proof: Groth16Proof; decryptCardShare: DecryptCardShare }> {
    let secretKeyBits = Scalar.bits(secretKey);
    secretKeyBits = secretKeyBits.concat(
      new Array(252 - secretKeyBits.length).fill(0),
    );
    const publicKey = this.generatePublicKey(secretKey);
    const inputPoint = deck[cardIndex]?.slice(0, 2) as [string, string];
    const { proof, publicSignals } = await groth16.fullProve(
      {
        secretKeyBits,
        publicKey,
        inputPoint,
      },
      this.decryptCardShareWasm,
      this.decryptCardShareZkey,
    );
    const decryptCardShare = publicSignals.slice(0, 2) as DecryptCardShare;
    return { proof, decryptCardShare };
  }

  public async verifyDecryptCardShare(
    proof: Groth16Proof,
    publicKey: PublicKey,
    cardIndex: number,
    deck: EncryptedDeck,
    decryptCardShare: DecryptCardShare,
  ): Promise<boolean> {
    return groth16.verify(
      decryptCardShareVerificationKey,
      [
        ...decryptCardShare,
        ...publicKey,
        ...(deck[cardIndex]?.slice(0, 2) as [string, string]),
      ],
      proof,
    );
  }

  public decryptCard(
    cardIndex: number,
    deck: EncryptedDeck,
    decryptCardShares: DecryptCardShare[],
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
  shuffleEncryptDeckWasm: string,
  shuffleEncryptDeckZkey: string,
  decryptCardShareWasm: string,
  decryptCardShareZkey: string,
): Promise<ZKDeck> {
  const curve = await createJubJub();
  return new ZKDeck(
    curve,
    shuffleEncryptDeckWasm,
    shuffleEncryptDeckZkey,
    decryptCardShareWasm,
    decryptCardShareZkey,
  );
}
