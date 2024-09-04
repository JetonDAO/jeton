pragma circom 2.0.0;

include "./templates/decrypt_card_share.circom";

component main { public[ publicKey, inputPoint ] } = DecryptCardShare(251);
