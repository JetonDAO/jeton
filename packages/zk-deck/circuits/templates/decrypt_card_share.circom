pragma circom 2.0.0;

include "../../../../node_modules/circomlib/circuits/escalarmulany.circom";
include "../../../../node_modules/circomlib/circuits/escalarmulfix.circom";

template DecryptCardShare(numBits) {
    signal input secretKeyBits[numBits];
    signal input publicKey[2];
    signal input inputPoint[2];
    signal output outputPoint[2];

    var BASE8[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];
    
    for (var i = 0; i < numBits; i++) {
        secretKeyBits[i] * (secretKeyBits[i] - 1) === 0;
    }
    
    component multiplySecretKeyBase8 = EscalarMulFix(numBits, BASE8);
    for (var i = 0; i < numBits; i++) {
        multiplySecretKeyBase8.e[i] <== secretKeyBits[i];
    }
    for (var i = 0; i < 2; i++) {
        multiplySecretKeyBase8.out[i] === publicKey[i];
    }

    component multiplySecretKeyInputVector = EscalarMulAny(numBits);
    for (var i = 0; i < numBits; i++) {
        multiplySecretKeyInputVector.e[i] <== secretKeyBits[i];
    }
    for (var i = 0; i < 2; i++) {
        multiplySecretKeyInputVector.p[i] <== inputPoint[i];
    }
    for(var i = 0; i < 2; i++) {
        outputPoint[i] <== multiplySecretKeyInputVector.out[i];
    }
}