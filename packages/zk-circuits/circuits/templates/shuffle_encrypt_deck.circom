pragma circom 2.0.0;

include "./shuffle_deck.circom";
include "./encrypt_deck.circom";

template ShuffleEncryptDeck(n) {
    signal input permutationMatrix[n][n];
    signal input aggregatedPublicKey[2];
    signal input randomVector[n];
    signal input inputDeck[n][4];
    signal output outputDeck[n][4];

    component shuffleDeck = ShuffleDeck(n);
    for (var i = 0; i < n; i++) {
        for (var j = 0; j < n; j++) {
            shuffleDeck.permutationMatrix[i][j] <== permutationMatrix[i][j];
        }
        for (var j = 0; j < 4; j++) {
            shuffleDeck.inputDeck[i][j] <== inputDeck[i][j];
        }
    }

    component encryptDeck = EncryptDeck(n);
    for (var i = 0; i < 2; i++) {
        encryptDeck.aggregatedPublicKey[i] <== aggregatedPublicKey[i];
    }
    for (var i = 0; i < n; i++) {
        encryptDeck.randomVector[i] <== randomVector[i];
        for (var j = 0; j < 4; j++) {
            encryptDeck.inputDeck[i][j] <== inputDeck[i][j];
        }
    }

    for (var i = 0; i < n; i++) {
        for (var j = 0; j < 4; j++) {
            outputDeck[i][j] <== encryptDeck.outputDeck[i][j];
        }
    }
}