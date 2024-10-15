pragma circom 2.0.0;

include "./shuffle_deck.circom";
include "./encrypt_deck.circom";

template ShuffleEncryptDeck(numCards, numTripleBits, edwardsA, edwardsD, generator) {
    var numBits = 3 * numTripleBits;

    signal input permutationMatrix[numCards][numCards];
    signal input aggregatedPublicKey[2];
    signal input randomVectorBits[numCards][numBits];
    signal input inputDeck[numCards][4];
    signal output outputDeck[numCards][4];

    component shuffleDeck = ShuffleDeck(numCards);
    for (var i = 0; i < numCards; i++) {
        for (var j = 0; j < numCards; j++) {
            shuffleDeck.permutationMatrix[i][j] <== permutationMatrix[i][j];
        }
        for (var j = 0; j < 4; j++) {
            shuffleDeck.inputDeck[i][j] <== inputDeck[i][j];
        }
    }

    component encryptDeck = EncryptDeck(numCards, numTripleBits, edwardsA, edwardsD, generator);
    encryptDeck.aggregatedPublicKey[0] <== aggregatedPublicKey[0];
    encryptDeck.aggregatedPublicKey[1] <== aggregatedPublicKey[1];
    for (var i = 0; i < numCards; i++) {
        for (var j = 0; j < numBits; j++) {
            encryptDeck.randomVectorBits[i][j] <== randomVectorBits[i][j];
        }
        for (var j = 0; j < 4; j++) {
            encryptDeck.inputDeck[i][j] <== shuffleDeck.outputDeck[i][j];
        }
    }

    for (var i = 0; i < numCards; i++) {
        for (var j = 0; j < 4; j++) {
            outputDeck[i][j] <== encryptDeck.outputDeck[i][j];
        }
    }
}