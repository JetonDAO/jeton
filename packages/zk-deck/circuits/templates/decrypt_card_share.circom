pragma circom 2.0.0;

include "../../../../node_modules/circomlib/circuits/bitify.circom";
include "../../../../node_modules/circomlib/circuits/escalarmulany.circom";
include "../../../../node_modules/circomlib/circuits/escalarmulfix.circom";

template DecryptCard() {
    signal input secretKey;
    signal input publicKey[2];
    signal input inputVector[2];
    signal output outputVector[2];

    var BASE8[2] = [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ];
    
    component secretKeyBits = Num2Bits(254);
    secretKeyBits.in <== secretKey;

    component multiplySecretKeyBase8 = EscalarMulFix(254, BASE8);
    for (var i = 0; i < 254; i++) {
        multiplySecretKeyBase8.e[i] <== secretKeyBits.out[i];
    }
    for (var i = 0; i < 2; i++) {
        multiplySecretKeyBase8.out[i] === publicKey[i];
    }

    component multiplySecretKeyInputVector = EscalarMulAny(254);
    for (var i = 0; i < 254; i++) {
        multiplySecretKeyInputVector.e[i] <== secretKeyBits.out[i];
    }
    for (var i = 0; i < 2; i++) {
        multiplySecretKeyInputVector.p[i] <== inputVector[i];
    }
    for(var i = 0; i < 2; i++) {
        outputVector[i] <== multiplySecretKeyInputVector.out[i];
    }
}