import { Scalar } from "ffjavascript";
import { type Groth16Proof, groth16 } from "snarkjs";

import decryptCardShareVerificationKey from "#verificationkey:decrypt-card-share.json";
import { numTripleBits } from "./constants.js";

export async function proveDecryptCardShare(
  secretKey: bigint,
  publicKey: [string, string],
  inputPoint: [string, string],
  decryptCardShareWasm: string | Uint8Array,
  decryptCardShareZkey: string | Uint8Array,
): Promise<{ proof: Groth16Proof; outputPoint: [string, string] }> {
  let secretKeyBits = Scalar.bits(secretKey);
  secretKeyBits = secretKeyBits.concat(new Array(3 * numTripleBits - secretKeyBits.length).fill(0));
  const { proof, publicSignals } = await groth16.fullProve(
    {
      secretKeyBits,
      publicKey,
      inputPoint,
    },
    decryptCardShareWasm,
    decryptCardShareZkey,
  );
  const outputPoint = publicSignals.slice(0, 2) as [string, string];
  return { proof, outputPoint };
}

export function verifyDecryptCardShare(
  publicKey: [string, string],
  inputPoint: [string, string],
  outputPoint: [string, string],
  proof: Groth16Proof,
): Promise<boolean> {
  return groth16.verify(
    decryptCardShareVerificationKey,
    [...outputPoint, ...publicKey, ...inputPoint],
    proof,
  );
}
