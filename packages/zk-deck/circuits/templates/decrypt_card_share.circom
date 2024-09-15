pragma circom 2.0.0;

include "./multiply_scalar_twisted_edwards_curve_fix_point.circom";
include "./multiply_scalar_twisted_edwards_curve_point.circom";

template DecryptCardShare(numTripleBits, edwardsA, edwardsD, generator) {
    var numBits = 3 * numTripleBits;

    signal input secretKeyBits[numBits];
    signal input publicKey[2];
    signal input inputPoint[2];
    signal output outputPoint[2];

    component multiplyGenerator = MultiplyScalarTwistedEdwardsCurveFixPoint(numTripleBits, edwardsA, edwardsD, generator);
    for (var i = 0; i < numBits; i++) {
        multiplyGenerator.scalarBits[i] <== secretKeyBits[i];
    }
    publicKey[0] === multiplyGenerator.outputPoint[0];
    publicKey[1] === multiplyGenerator.outputPoint[1];

    component multiplyInputPoint = MultiplyScalarTwistedEdwardsCurvePoint(numBits, edwardsA, edwardsD);
    for (var i = 0; i < numBits; i++) {
        multiplyInputPoint.scalarBits[i] <== secretKeyBits[i];
    }
    multiplyInputPoint.inputPoint[0] <== inputPoint[0];
    multiplyInputPoint.inputPoint[1] <== inputPoint[1];
    outputPoint[0] <== multiplyInputPoint.outputPoint[0];
    outputPoint[1] <== multiplyInputPoint.outputPoint[1];
}