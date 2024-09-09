pragma circom 2.0.0;

include "./templates/shuffle_encrypt_deck.circom";

component main { public[ aggregatedPublicKey, inputDeck ] } = ShuffleEncryptDeck(
    52,
    84,
    168700,
    168696,
    [
        5299619240641551281634865583518297030282874472190772894086521144482721001553,
        16950150798460657717958625567821834550301663161624707787222815936182638968203
    ]
);
