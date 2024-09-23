import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { before, describe, test } from "mocha";
use(chaiAsPromised);

import { buildBls12381 } from "ffjavascript";

import { numCards } from "./constants.js";
import { JubJub, type Point } from "./jubjub.js";
import {
  applyPermutationVector,
  createPermutationMatrix,
  samplePermutationVector,
} from "./permutation.js";
import { proveShuffleEncryptDeck, verifyShuffleEncryptDeck } from "./shuffle_encrypt_deck.js";

import { shuffleEncryptDeckZkey } from "./zkey.test.js";
const shuffleEncrypDeckWasm =
  "./dist/circuits/shuffle_encrypt_deck/shuffle_encrypt_deck_js/shuffle_encrypt_deck.wasm";

describe("shuffle encrypt deck", () => {
  let jubjub: JubJub;
  before(async () => {
    const bls12381 = await buildBls12381(true);
    jubjub = new JubJub(bls12381.Fr);
  });

  test("should prove and verify shuffle_encrypt_deck", async () => {
    const aggregatedPublicKeyValue = jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator);
    const aggregatedPublicKey = jubjub.toStringTuple(aggregatedPublicKeyValue);
    const permutationVector = samplePermutationVector(numCards);
    const permutationMatrix = createPermutationMatrix(permutationVector);
    const randomVector = new Array(numCards).fill(undefined).map((_) => jubjub.sampleScalar());
    const inputDeckValues = new Array(numCards)
      .fill(undefined)
      .map(
        (_) =>
          [
            jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator),
            jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator),
          ] as [Point, Point],
      );
    const inputDeck = inputDeckValues.map(
      ([p1, p2]) =>
        [...jubjub.toStringTuple(p1), ...jubjub.toStringTuple(p2)] as [
          string,
          string,
          string,
          string,
        ],
    );
    const expectedOutputPoint = applyPermutationVector(permutationVector, inputDeckValues)
      .map(
        ([p1, p2], i) =>
          [
            jubjub.addPoints(
              p1,
              jubjub.mulScalarPoint(randomVector[i] as bigint, jubjub.generator),
            ),
            jubjub.addPoints(
              p2,
              jubjub.mulScalarPoint(randomVector[i] as bigint, aggregatedPublicKeyValue),
            ),
          ] as [Point, Point],
      )
      .map(
        ([p1, p2]) =>
          [...jubjub.toStringTuple(p1), ...jubjub.toStringTuple(p2)] as [
            string,
            string,
            string,
            string,
          ],
      );

    const { proof, outputDeck } = await proveShuffleEncryptDeck(
      permutationMatrix,
      aggregatedPublicKey,
      randomVector,
      inputDeck,
      shuffleEncrypDeckWasm,
      shuffleEncryptDeckZkey,
    );
    expect(outputDeck).to.deep.equal(expectedOutputPoint);
    expect(await verifyShuffleEncryptDeck(aggregatedPublicKey, inputDeck, outputDeck, proof)).to.be
      .true;
  });

  test("should not generate proof if permutation matrix is invalid", async () => {
    const aggregatedPublicKey = jubjub.toStringTuple(
      jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator),
    );
    const permutationVector = samplePermutationVector(numCards);
    const permutationMatrix = createPermutationMatrix(permutationVector);
    const randomVector = new Array(numCards).fill(undefined).map((_) => jubjub.sampleScalar());
    const inputDeck = new Array(numCards)
      .fill(undefined)
      .map(
        (_) =>
          [
            ...jubjub.toStringTuple(jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator)),
            ...jubjub.toStringTuple(jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator)),
          ] as [string, string, string, string],
      );

    const faultyPermutationMatrix1 = permutationMatrix.map((row) => [...row]);
    (faultyPermutationMatrix1[0] as number[])[0] = 2;
    await expect(
      proveShuffleEncryptDeck(
        faultyPermutationMatrix1,
        aggregatedPublicKey,
        randomVector,
        inputDeck,
        shuffleEncrypDeckWasm,
        shuffleEncryptDeckZkey,
      ),
    ).to.rejected;

    const faultyPermutationMatrix2 = permutationMatrix.map((row) => [...row]);
    (faultyPermutationMatrix2[0] as number[])[permutationMatrix[0]?.indexOf(1) as number] = 0;
    await expect(
      proveShuffleEncryptDeck(
        faultyPermutationMatrix2,
        aggregatedPublicKey,
        randomVector,
        inputDeck,
        shuffleEncrypDeckWasm,
        shuffleEncryptDeckZkey,
      ),
    ).to.rejected;

    const faultyPermutationMatrix3 = permutationMatrix.map((row) => [...row]);
    if (faultyPermutationMatrix3[0]?.[0] === 0) {
      (faultyPermutationMatrix3[0] as number[])[0] = 1;
    } else {
      (faultyPermutationMatrix3[0] as number[])[1] = 1;
    }
    await expect(
      proveShuffleEncryptDeck(
        faultyPermutationMatrix3,
        aggregatedPublicKey,
        randomVector,
        inputDeck,
        shuffleEncrypDeckWasm,
        shuffleEncryptDeckZkey,
      ),
    ).to.rejected;
  });
});
