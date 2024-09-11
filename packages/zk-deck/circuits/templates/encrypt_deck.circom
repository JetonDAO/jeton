pragma circom 2.0.0;

include "./encrypt_card.circom";

template EncryptDeck(numCards, numTripleBits, edwardsA, edwardsD, generator) {
    var numBits = 3 * numTripleBits;

    signal input aggregatedPublicKey[2];
    signal input randomVectorBits[numCards][numBits];
    signal input inputDeck[numCards][4];
    signal output outputDeck[numCards][4];

    component encryptCard[numCards];
    for (var i = 0; i < numCards; i++) {
        encryptCard[i] = EncryptCard(numTripleBits, edwardsA, edwardsD, generator);
        encryptCard[i].aggregatedPublicKey[0] <== aggregatedPublicKey[0];
        encryptCard[i].aggregatedPublicKey[1] <== aggregatedPublicKey[1];
        for (var j = 0; j < numBits; j++) {
            encryptCard[i].randomBits[j] <== randomVectorBits[i][j];
        }
        for (var j = 0; j < 4; j++) {
            encryptCard[i].inputCard[j] <== inputDeck[i][j];
        }
        for (var j = 0; j < 4; j++) {
            outputDeck[i][j] <== encryptCard[i].outputCard[j];
        }
    }
}