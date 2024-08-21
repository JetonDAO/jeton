pragma circom 2.0.0;

include "./encrypt_card.circom";

template EncryptDeck(n) {
    signal input aggregatedPublicKey[2];
    signal input randomVector[n];
    signal input inputDeck[n][4];
    signal output outputDeck[n][4];

    component encryptCard[n];
    for (var i = 0; i < n; i++) {
        encryptCard[i] = EncryptCard();
        encryptCard[i].random <== randomVector[i];
        for (var j = 0; j < 2; j++) {
            encryptCard[i].aggregatedPublicKey[j] <== aggregatedPublicKey[j];
        }
        for (var j = 0; j < 4; j++) {
            encryptCard[i].inputVector[j] <== inputDeck[i][j];
        }
        for (var j = 0; j < 4; j++) {
            outputDeck[i][j] <== encryptCard[i].outputVector[j];
        }
    }
}