pragma circom 2.0.0;

include "./templates/shuffle_encrypt_deck.circom";

component main { public[ aggregatedPublicKey, inputDeck ] } = ShuffleEncryptDeck(52, 251);
