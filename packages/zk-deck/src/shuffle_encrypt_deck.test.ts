import { expect, use } from "chai";
import chaiAsPromised from "chai-as-promised";
import { before, describe, test } from "mocha";
use(chaiAsPromised);

import { numCards } from "./constants.js";
import {
  applyPermutationVector,
  createPermutationMatrix,
  samplePermutationVector,
} from "./permutation.js";
import {
  proveShuffleEncryptDeck,
  verifyShuffleEncryptDeck,
} from "./shuffle_encrypt_deck.js";
import {
  type Point,
  type TwistedEdwardsCurve,
  createJubJub,
} from "./twisted_edwards_curve.js";

import { shuffleEncryptDeckZkey } from "./zkey.test.js";
const shuffleEncrypDeckWasm =
  "./dist/circuits/shuffle_encrypt_deck/shuffle_encrypt_deck_js/shuffle_encrypt_deck.wasm";

describe("shuffle encrypt deck", () => {
  let curve: TwistedEdwardsCurve;
  before(async () => {
    curve = await createJubJub();
  });

  test("should prove and verify shuffle_encrypt_deck", async () => {
    const aggregatedPublicKeyValue = curve.mulScalarPoint(
      curve.sampleScalar(),
      curve.generator,
    );
    const aggregatedPublicKey = curve.pointToStringTuple(
      aggregatedPublicKeyValue,
    );
    const permutationVector = samplePermutationVector(numCards);
    const permutationMatrix = createPermutationMatrix(permutationVector);
    const randomVector = new Array(numCards)
      .fill(undefined)
      .map((_) => curve.sampleScalar());
    const inputDeckValues = new Array(numCards)
      .fill(undefined)
      .map(
        (_) =>
          [
            curve.mulScalarPoint(curve.sampleScalar(), curve.generator),
            curve.mulScalarPoint(curve.sampleScalar(), curve.generator),
          ] as [Point, Point],
      );
    const inputDeck = inputDeckValues.map(
      ([p1, p2]) =>
        [...curve.pointToStringTuple(p1), ...curve.pointToStringTuple(p2)] as [
          string,
          string,
          string,
          string,
        ],
    );
    const expectedOutputPoint = applyPermutationVector(
      permutationVector,
      inputDeckValues,
    )
      .map(
        ([p1, p2], i) =>
          [
            curve.addPoints(
              p1,
              curve.mulScalarPoint(randomVector[i] as bigint, curve.generator),
            ),
            curve.addPoints(
              p2,
              curve.mulScalarPoint(
                randomVector[i] as bigint,
                aggregatedPublicKeyValue,
              ),
            ),
          ] as [Point, Point],
      )
      .map(
        ([p1, p2]) =>
          [
            ...curve.pointToStringTuple(p1),
            ...curve.pointToStringTuple(p2),
          ] as [string, string, string, string],
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
    expect(
      await verifyShuffleEncryptDeck(
        aggregatedPublicKey,
        inputDeck,
        outputDeck,
        proof,
      ),
    ).to.be.true;
  });

  test("should not generate proof if permutation matrix is invalid", async () => {
    const aggregatedPublicKey = curve.pointToStringTuple(
      curve.mulScalarPoint(curve.sampleScalar(), curve.generator),
    );
    const permutationVector = samplePermutationVector(numCards);
    const permutationMatrix = createPermutationMatrix(permutationVector);
    const randomVector = new Array(numCards)
      .fill(undefined)
      .map((_) => curve.sampleScalar());
    const inputDeck = new Array(numCards)
      .fill(undefined)
      .map(
        (_) =>
          [
            ...curve.pointToStringTuple(
              curve.mulScalarPoint(curve.sampleScalar(), curve.generator),
            ),
            ...curve.pointToStringTuple(
              curve.mulScalarPoint(curve.sampleScalar(), curve.generator),
            ),
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
    (faultyPermutationMatrix2[0] as number[])[
      permutationMatrix[0]?.indexOf(1) as number
    ] = 0;
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
