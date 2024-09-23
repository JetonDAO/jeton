import { expect } from "chai";
import { before, describe, test } from "mocha";

import { buildBls12381 } from "ffjavascript";

import { proveDecryptCardShare, verifyDecryptCardShare } from "./decrypt_card_share.js";
import { JubJub } from "./jubjub.js";

import { decryptCardShareZkey } from "./zkey.test.js";
const decryptCardShareWasm =
  "./dist/circuits/decrypt_card_share/decrypt_card_share_js/decrypt_card_share.wasm";

describe("decrypt card share", () => {
  let jubjub: JubJub;
  before(async () => {
    const bls12381 = await buildBls12381(true);
    jubjub = new JubJub(bls12381.Fr);
  });

  test("should prove and verify decrypt_card_share", async () => {
    const secretKey = jubjub.sampleScalar();
    const publicKey = jubjub.toStringTuple(jubjub.mulScalarPoint(secretKey, jubjub.generator));
    const inputPointValue = jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator);
    const inputPoint = jubjub.toStringTuple(inputPointValue);
    const expectedOutputPoint = jubjub.toStringTuple(
      jubjub.mulScalarPoint(secretKey, inputPointValue),
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
    const secretKey = jubjub.sampleScalar();
    const publicKey = jubjub.toStringTuple(
      jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator),
    );
    const inputPoint = jubjub.toStringTuple(
      jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator),
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
