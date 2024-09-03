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
      "dist/zkeys/shuffle_encrypt_deck.zkey",
      "dist/circuits/decrypt_card_share/decrypt_card_share_js/decrypt_card_share.wasm",
      "dist/zkeys/decrypt_card_share.zkey",
    );
  });

  test("should prove and verify shuffle_encrypt_deck", async () => {
    const aggregatedPublicKey = zkdeck.generateAggregatedPublicKey(
      new Array(5)
        .fill(undefined)
        .map((_) => zkdeck.generatePublicKey(zkdeck.sampleSecretKey())),
    );
    const inDeck: EncryptedDeck = new Array(numCards)
      .fill(undefined)
      .map((_) => [
        ...zkdeck.curve.pointToStringTuple(
          zkdeck.curve.mulScalarPoint(
            zkdeck.curve.sampleScalar(),
            zkdeck.curve.generator,
          ),
        ),
        ...zkdeck.curve.pointToStringTuple(
          zkdeck.curve.mulScalarPoint(
            zkdeck.curve.sampleScalar(),
            zkdeck.curve.generator,
          ),
        ),
      ]);
    const permutationVector = samplePermutationVector(numCards);
    const randomVector = new Array(numCards)
      .fill(undefined)
      .map((_) => zkdeck.curve.sampleScalar());
    const { proof, deck } = await zkdeck.proveShuffleEncryptDeck(
      aggregatedPublicKey,
      inDeck,
      permutationVector,
      randomVector,
    );
    expect(
      await zkdeck.verifyShuffleEncryptDeck(
        proof,
        aggregatedPublicKey,
        inDeck,
        deck,
      ),
    ).to.be.true;
    expect(deck).to.deep.equal(
      zkdeck.shuffleEncryptDeck(
        aggregatedPublicKey,
        inDeck,
        permutationVector,
        randomVector,
      ),
    );
  });

  test("should prove and verify decrypt_card_share", async () => {
    const secretKey = zkdeck.sampleSecretKey();
    const publicKey = zkdeck.generatePublicKey(secretKey);
    const cardIndex = 50;
    const inDeck: EncryptedDeck = new Array(numCards)
      .fill(undefined)
      .map((_) => [
        ...zkdeck.curve.pointToStringTuple(
          zkdeck.curve.mulScalarPoint(
            zkdeck.curve.sampleScalar(),
            zkdeck.curve.generator,
          ),
        ),
        ...zkdeck.curve.pointToStringTuple(
          zkdeck.curve.mulScalarPoint(
            zkdeck.curve.sampleScalar(),
            zkdeck.curve.generator,
          ),
        ),
      ]);
    const { proof, decryptCardShare } = await zkdeck.proveDecryptCardShare(
      secretKey,
      cardIndex,
      inDeck,
    );
    expect(
      await zkdeck.verifyDecryptCardShare(
        proof,
        publicKey,
        cardIndex,
        inDeck,
        decryptCardShare,
      ),
    ).to.be.true;
    expect(decryptCardShare).to.deep.equal(
      zkdeck.decryptCardShare(secretKey, cardIndex, inDeck),
    );
  });

  test("cards should have correct order after shuffle_encrypt and decrypt", async () => {
    const numPlayers = 3;
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
      encryptedDeck = await zkdeck
        .proveShuffleEncryptDeck(
          aggregatedPublicKey,
          encryptedDeck,
          permutationVectors[i],
        )
        .then(({ deck }) => deck);
    }

    const deck = await Promise.all(
      Array.from(new Array(numCards).keys()).map(async (cardIndex) => {
        const shares = await Promise.all(
          secretKeys.map((secretKeys) =>
            zkdeck
              .proveDecryptCardShare(secretKeys, cardIndex, encryptedDeck)
              .then(({ decryptCardShare }) => decryptCardShare),
          ),
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
  }).timeout(5 * 60 * 1000);
});
