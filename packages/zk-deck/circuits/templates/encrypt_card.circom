pragma circom 2.0.0;

include "../../../../node_modules/circomlib/circuits/escalarmulany.circom";
include "../../../../node_modules/circomlib/circuits/escalarmulfix.circom";
include "../../../../node_modules/circomlib/circuits/babyjub.circom";

template EncryptCard(numBits) {
    signal input aggregatedPublicKey[2];
    signal input randomBits[numBits];
    signal input inputCard[4];
    signal output outputCard[4];

    var BASE8[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];

    for (var i = 0; i < numBits; i++) {
        randomBits[i] * (randomBits[i] - 1) === 0;
    }
    
    component multiplyRandomBase8 = EscalarMulFix(numBits, BASE8);
    for (var i = 0; i < numBits; i++) {
        multiplyRandomBase8.e[i] <== randomBits[i];
    }

    component multiplyRandomPublicKey = EscalarMulAny(numBits);
    for (var i = 0; i < numBits; i++) {
        multiplyRandomPublicKey.e[i] <== randomBits[i];
    }
    for (var i = 0; i < 2; i++) {
        multiplyRandomPublicKey.p[i] <== aggregatedPublicKey[i];
    }

    component addFirstPoint = BabyAdd();
    addFirstPoint.x1 <== inputCard[0];
    addFirstPoint.y1 <== inputCard[1];
    addFirstPoint.x2 <== multiplyRandomBase8.out[0];
    addFirstPoint.y2 <== multiplyRandomBase8.out[1];
    outputCard[0] <== addFirstPoint.xout;
    outputCard[1] <== addFirstPoint.yout;

    component addSecondPoint = BabyAdd();
    addSecondPoint.x1 <== inputCard[2];
    addSecondPoint.y1 <== inputCard[3];
    addSecondPoint.x2 <== multiplyRandomPublicKey.out[0];
    addSecondPoint.y2 <== multiplyRandomPublicKey.out[1];
    outputCard[2] <== addSecondPoint.xout;
    outputCard[3] <== addSecondPoint.yout;
}