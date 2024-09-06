import { expect } from "chai";
import { before, describe, test } from "mocha";

import {
  type EncryptedDeck,
  type ZKDeck,
  createZKDeck,
  numCards,
} from "./index.js";
import {
  applyPermutationVector,
  samplePermutationVector,
} from "./permutation.js";

describe("ZKDeck", () => {
  let zkdeck: ZKDeck;
  before(async () => {
    zkdeck = await createZKDeck(
      "dist/circuits/shuffle_encrypt_deck/shuffle_encrypt_deck_js/shuffle_encrypt_deck.wasm",
      "dist/circuits/decrypt_card_share/decrypt_card_share_js/decrypt_card_share.wasm",
    );
  });

  for (let numPlayers = 2; numPlayers <= 5; numPlayers++) {
    test(`end to end of shuffle, encrypt and decrypt for ${numPlayers} player`, async () => {
      const secretKeys = new Array(numPlayers)
        .fill(undefined)
        .map((_) => zkdeck.sampleSecretKey());
      const aggregatedPublicKey = zkdeck.generateAggregatedPublicKey(
        secretKeys.map((secretKey) => zkdeck.generatePublicKey(secretKey)),
      );
      const permutationVectors = new Array(numPlayers)
        .fill(undefined)
        .map((_) => samplePermutationVector(numCards));
      let encryptedDeck = zkdeck.initialEncryptedDeck;
      for (let i = 0; i < numPlayers; i++) {
        const { proof, outputDeck } = await zkdeck.proveShuffleEncryptDeck(
          aggregatedPublicKey,
          encryptedDeck,
          permutationVectors[i],
        );
        expect(
          await zkdeck.verifyShuffleEncryptDeck(
            aggregatedPublicKey,
            encryptedDeck,
            outputDeck,
            proof,
          ),
        ).to.be.true;
        encryptedDeck = outputDeck;
      }

      const deck = await Promise.all(
        Array.from(new Array(numCards).keys()).map(async (cardIndex) => {
          const shares = await Promise.all(
            secretKeys.map(async (secretKeys) => {
              const publicKey = zkdeck.generatePublicKey(secretKeys);
              const { proof, decryptionCardShare } =
                await zkdeck.proveDecryptCardShare(
                  secretKeys,
                  cardIndex,
                  encryptedDeck,
                );

              expect(
                await zkdeck.verifyDecryptCardShare(
                  publicKey,
                  cardIndex,
                  encryptedDeck,
                  decryptionCardShare,
                  proof,
                ),
              ).to.be.true;

              return decryptionCardShare;
            }),
          );
          return zkdeck.decryptCard(cardIndex, encryptedDeck, shares);
        }),
      );

      expect(deck).to.deep.equal(
        permutationVectors.reduce(
          (deck, permutationVector) =>
            applyPermutationVector(permutationVector, deck),
          Array.from(new Array(numCards).keys()),
        ),
      );
    }).timeout(numPlayers * 60 * 1000);
  }
});
