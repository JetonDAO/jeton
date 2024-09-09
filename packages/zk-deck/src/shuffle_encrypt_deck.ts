import { Scalar } from "ffjavascript";
import { type Groth16Proof, groth16 } from "snarkjs";

import shuffleEncryptDeckVerificationKey from "#verificationkey:shuffle-encrypt-deck.json";
import { numCards, numTripleBits } from "./constants.js";

const shuffleEncryptDeckZkey =
  "https://pub-1f3741fa9e934be4a24cfe1d391d2163.r2.dev/shuffle_encrypt_deck.zkey";

export async function proveShuffleEncryptDeck(
  permutationMatrix: number[][],
  aggregatedPublicKey: [string, string],
  randomVector: bigint[],
  inputDeck: [string, string, string, string][],
  shuffleEncryptDeckWasm: string | Uint8Array,
  shuffleEncryptDeckZkey: string | Uint8Array,
): Promise<{
  proof: Groth16Proof;
  outputDeck: [string, string, string, string][];
}> {
  const randomVectorBits = randomVector.map((random) => {
    const bits = Scalar.bits(random);
    return bits.concat(new Array(3 * numTripleBits - bits.length).fill(0));
  });
  const { proof, publicSignals } = await groth16.fullProve(
    {
      permutationMatrix,
      aggregatedPublicKey,
      randomVectorBits,
      inputDeck,
    },
    shuffleEncryptDeckWasm,
    shuffleEncryptDeckZkey,
  );
  const outputDeck = Array.from(new Array(numCards).keys()).map(
    (i) =>
      publicSignals.slice(4 * i, 4 * i + 4) as [string, string, string, string],
  );
  return { proof, outputDeck };
}

export function verifyShuffleEncryptDeck(
  aggregatedPublicKey: [string, string],
  inputDeck: [string, string, string, string][],
  outputDeck: [string, string, string, string][],
  proof: Groth16Proof,
): Promise<boolean> {
  return groth16.verify(
    shuffleEncryptDeckVerificationKey,
    [...outputDeck.flat(), ...aggregatedPublicKey, ...inputDeck.flat()],
    proof,
  );
}
