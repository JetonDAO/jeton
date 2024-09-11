pragma circom 2.0.0;

include "./multiply_scalar_twisted_edwards_curve_fix_point.circom";
include "./multiply_scalar_twisted_edwards_curve_point.circom";
include "./add_twisted_edwards_curve_points.circom";

template EncryptCard(numTripleBits, edwardsA, edwardsD, generator) {
    var numBits = 3 * numTripleBits;

    signal input aggregatedPublicKey[2];
    signal input randomBits[numBits];
    signal input inputCard[4];
    signal output outputCard[4];

    component multiplyGenerator = MultiplyScalarTwistedEdwardsCurveFixPoint(numTripleBits, edwardsA, edwardsD, generator);
    for (var i = 0; i < numBits; i++) {
        multiplyGenerator.scalarBits[i] <== randomBits[i];
    }

    component addFirstPoint = AddTwistedEdwardsCurvePoints(edwardsA, edwardsD);
    addFirstPoint.inputPoints[0][0] <== inputCard[0];
    addFirstPoint.inputPoints[0][1] <== inputCard[1];
    addFirstPoint.inputPoints[1][0] <== multiplyGenerator.outputPoint[0];
    addFirstPoint.inputPoints[1][1] <== multiplyGenerator.outputPoint[1];
    outputCard[0] <== addFirstPoint.outputPoint[0];
    outputCard[1] <== addFirstPoint.outputPoint[1];

    component multiplyPublicKey = MultiplyScalarTwistedEdwardsCurvePoint(numBits, edwardsA, edwardsD);
    for (var i = 0; i < numBits; i++) {
        multiplyPublicKey.scalarBits[i] <== randomBits[i];
    }
    multiplyPublicKey.inputPoint[0] <== aggregatedPublicKey[0];
    multiplyPublicKey.inputPoint[1] <== aggregatedPublicKey[1];

    component addSecondPoint = AddTwistedEdwardsCurvePoints(edwardsA, edwardsD);
    addSecondPoint.inputPoints[0][0] <== inputCard[2];
    addSecondPoint.inputPoints[0][1] <== inputCard[3];
    addSecondPoint.inputPoints[1][0] <== multiplyPublicKey.outputPoint[0];
    addSecondPoint.inputPoints[1][1] <== multiplyPublicKey.outputPoint[1];
    outputCard[2] <== addSecondPoint.outputPoint[0];
    outputCard[3] <== addSecondPoint.outputPoint[1];
}