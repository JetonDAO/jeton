import { expect } from "chai";
import { before, describe, test } from "mocha";

import { proveDecryptCardShare, verifyDecryptCardShare } from "./decrypt_card_share.js";
import { type TwistedEdwardsCurve, createJubJub } from "./twisted_edwards_curve.js";

import { decryptCardShareZkey } from "./zkey.test.js";
const decryptCardShareWasm =
  "./dist/circuits/decrypt_card_share/decrypt_card_share_js/decrypt_card_share.wasm";

describe("decrypt card share", () => {
  let curve: TwistedEdwardsCurve;
  before(async () => {
    curve = await createJubJub();
  });

  test("should prove and verify decrypt_card_share", async () => {
    const secretKey = curve.sampleScalar();
    const publicKey = curve.pointToStringTuple(curve.mulScalarPoint(secretKey, curve.generator));
    const inputPointValue = curve.mulScalarPoint(curve.sampleScalar(), curve.generator);
    const inputPoint = curve.pointToStringTuple(inputPointValue);
    const expectedOutputPoint = curve.pointToStringTuple(
      curve.mulScalarPoint(secretKey, inputPointValue),
    );

    const { proof, outputPoint } = await proveDecryptCardShare(
      secretKey,
      publicKey,
      inputPoint,
      decryptCardShareWasm,
      decryptCardShareZkey,
    );
    expect(outputPoint).to.deep.equal(expectedOutputPoint);
    expect(await verifyDecryptCardShare(publicKey, inputPoint, outputPoint, proof)).to.be.true;
  });

  test("should not generate proof if publicKey does not match secretKey", async () => {
    const secretKey = curve.sampleScalar();
    const publicKey = curve.pointToStringTuple(
      curve.mulScalarPoint(curve.sampleScalar(), curve.generator),
    );
    const inputPoint = curve.pointToStringTuple(
      curve.mulScalarPoint(curve.sampleScalar(), curve.generator),
    );

    await expect(
      proveDecryptCardShare(
        secretKey,
        publicKey,
        inputPoint,
        decryptCardShareWasm,
        decryptCardShareZkey,
      ),
    ).to.rejected;
  });
});
