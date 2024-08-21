pragma circom 2.0.0;

include "./templates/decrypt_card.circom";

component main { public[ publicKey, inputVector ] } = DecryptCard();
