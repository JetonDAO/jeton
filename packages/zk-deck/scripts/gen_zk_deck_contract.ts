import { readFile, writeFile } from "node:fs/promises";
import Handlebars from "handlebars";

import decryptCardShareVerificationKey from "#verificationkey:decrypt-card-share.json";
import shuffleEncryptDeckVerificationKey from "#verificationkey:shuffle-encrypt-deck.json";
import { type ZKDeck, createZKDeck, numCards } from "../src/index.js";

function hexify(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => {
      let hex = byte.toString(16);
      if (hex.length === 1) {
        hex = `0${hex}`;
      }
      return hex;
    })
    .join("");
}

function serializeG1(zkDeck: ZKDeck, values: string[]): string {
  const point = zkDeck.bls12381.G1.fromObject(values.map((s) => BigInt(s)));
  return hexify(zkDeck.bls12381.G1.toUncompressed(point));
}

function serializeG2(zkDeck: ZKDeck, values: string[][]): string {
  const point = zkDeck.bls12381.G2.fromObject(values.map((ss) => ss.map((s) => BigInt(s))));
  return hexify(zkDeck.bls12381.G2.toUncompressed(point));
}

type VerificationKey =
  | typeof shuffleEncryptDeckVerificationKey
  | typeof decryptCardShareVerificationKey;
function serializeVerificationKey(zkDeck: ZKDeck, key: VerificationKey) {
  return {
    alpha: serializeG1(zkDeck, key.vk_alpha_1),
    beta: serializeG2(zkDeck, key.vk_beta_2),
    gamma: serializeG2(zkDeck, key.vk_gamma_2),
    delta: serializeG2(zkDeck, key.vk_delta_2),
    ic: key.IC.map((values) => serializeG1(zkDeck, values)),
  };
}

async function generateTestDeckData(zkDeck: ZKDeck, numPlayers: number) {
  const secretKeys = new Array(numPlayers).fill(undefined).map(() => zkDeck.sampleSecretKey());
  const publicKeys = secretKeys.map((secretKey) => zkDeck.generatePublicKey(secretKey));
  const aggregatedPublicKey = zkDeck.generateAggregatedPublicKey(publicKeys);

  const shuffleEncryptBytes: Uint8Array[] = [];
  const shuffleEncryptProofs: Uint8Array[] = [];
  let deck = zkDeck.initialEncryptedDeck;
  for (let i = 0; i < numPlayers; i++) {
    const { proof, outputDeck } = await zkDeck.proveShuffleEncryptDeck(aggregatedPublicKey, deck);
    shuffleEncryptBytes.push(outputDeck);
    shuffleEncryptProofs.push(proof);
    deck = outputDeck;
  }

  const decryptData = await Promise.all(
    Array.from(new Array(numPlayers).keys()).map((playerIndex) =>
      Promise.all(
        Array.from(new Array(numCards).keys()).map((cardIndex) =>
          zkDeck.proveDecryptCardShare(secretKeys[playerIndex], cardIndex, deck),
        ),
      ),
    ),
  );
  const decryptShares: Uint8Array[][] = [];
  const decryptProofs: Uint8Array[][] = [];
  for (let i = 0; i < numPlayers; i++) {
    const shares: Uint8Array[] = [];
    const proofs: Uint8Array[] = [];
    for (let j = 0; j < numCards; j++) {
      shares.push(decryptData[i][j].decryptionCardShare);
      proofs.push(decryptData[i][j].proof);
    }
    decryptShares.push(shares);
    decryptProofs.push(proofs);
  }
  const outputDeck: number[] = [];
  for (let i = 0; i < numCards; i++) {
    outputDeck.push(
      zkDeck.decryptCard(
        i,
        deck,
        decryptShares.map((shares) => shares[i]),
      ),
    );
  }

  return {
    publicKeys: publicKeys.map((pk) => hexify(pk)),
    shuffleEncryptBytes: shuffleEncryptBytes.map((ed) => hexify(ed)),
    shuffleEncryptProofs: shuffleEncryptProofs.map((ep) => hexify(ep)),
    decryptShares: decryptShares.map((dcss) => dcss.map((dcs) => hexify(dcs))),
    decryptProofs: decryptProofs.map((dps) => dps.map((dp) => hexify(dp))),
    outputDeck,
  };
}

async function main() {
  const zkDeck = await createZKDeck(
    "./dist/circuits/shuffle_encrypt_deck/shuffle_encrypt_deck_js/shuffle_encrypt_deck.wasm",
    "./dist/circuits/decrypt_card_share/decrypt_card_share_js/decrypt_card_share.wasm",
    "./dist/zkeys/shuffle_encrypt_deck.zkey",
    "./dist/zkeys/decrypt_card_share.zkey",
  );
  const data = {
    shuffleEncryptDeck: serializeVerificationKey(zkDeck, shuffleEncryptDeckVerificationKey),
    decryptCardShare: serializeVerificationKey(zkDeck, decryptCardShareVerificationKey),
    test: await generateTestDeckData(zkDeck, 2),
  };

  const template = await readFile("scripts/zk_deck.move.hbs", {
    encoding: "utf8",
  });
  const generator = Handlebars.compile(template);
  const contract = generator(data);
  await writeFile("contracts/sources/zk_deck.move", contract);
  process.exit(0);
}

await main();
