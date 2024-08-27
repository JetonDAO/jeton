pragma circom 2.0.0;

include "../../../../node_modules/circomlib/circuits/bitify.circom";
include "../../../../node_modules/circomlib/circuits/escalarmulany.circom";
include "../../../../node_modules/circomlib/circuits/escalarmulfix.circom";
include "../../../../node_modules/circomlib/circuits/babyjub.circom";

template EncryptCard() {
    signal input aggregatedPublicKey[2];
    signal input random;
    signal input inputVector[4];
    signal output outputVector[4];

    var BASE8[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];
    
    component randomBits = Num2Bits(254);
    randomBits.in <== random;

    component multiplyRandomBase8 = EscalarMulFix(254, BASE8);
    for (var i = 0; i < 254; i++) {
        multiplyRandomBase8.e[i] <== randomBits.out[i];
    }

    component multiplyRandomPublicKey = EscalarMulAny(254);
    for (var i = 0; i < 254; i++) {
        multiplyRandomPublicKey.e[i] <== randomBits.out[i];
    }
    for (var i = 0; i < 2; i++) {
        multiplyRandomPublicKey.p[i] <== aggregatedPublicKey[i];
    }

    component addFirstPoint = BabyAdd();
    addFirstPoint.x1 <== inputVector[0];
    addFirstPoint.y1 <== inputVector[1];
    addFirstPoint.x2 <== multiplyRandomBase8.out[0];
    addFirstPoint.y2 <== multiplyRandomBase8.out[1];
    outputVector[0] <== addFirstPoint.xout;
    outputVector[1] <== addFirstPoint.yout;

    component addSecondPoint = BabyAdd();
    addSecondPoint.x1 <== inputVector[2];
    addSecondPoint.y1 <== inputVector[3];
    addSecondPoint.x2 <== multiplyRandomPublicKey.out[0];
    addSecondPoint.y2 <== multiplyRandomPublicKey.out[1];
    outputVector[2] <== addSecondPoint.xout;
    outputVector[3] <== addSecondPoint.yout;
}