"use client";
import type { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { GameEventTypes, type Jeton } from "@jeton/ts-sdk";
import { when } from "@legendapp/state";
import { state$ } from "../state";
import {
  awaitingPlayerBetHandler,
  handStartedHandler,
  newPlayerCheckedInHandler,
  playerPlacedBetHandler,
  playerShufflingHandler,
  privateCardsDecryptionHandler,
  receivedPrivateCardHandler,
  receivedPublicCardsHandler,
} from "./gameEventHandlers";

import { decryptCardShareZkey, shuffleEncryptDeckZkey } from "@jeton/zk-deck";
//@ts-ignore
import decryptCardShareWasm from "@jeton/zk-deck/wasm/decrypt-card-share.wasm";
//@ts-ignore
import shuffleEncryptDeckWasm from "@jeton/zk-deck/wasm/shuffle-encrypt-deck.wasm";

export const initGame = async (
  address: string,
  signAndSubmitTransaction: (transaction: InputTransactionData) => Promise<void>,
  joinTable: (typeof Jeton)["joinTable"],
  game?: Jeton,
) => {
  await when(
    () => state$.tableId.get() !== undefined && state$.loading.get() && !state$.initializing.get(),
  );
  if (state$.initializing.get()) {
    return;
  }
  console.log("init game", game);
  state$.initializing.set(true);
  const tableId = state$.tableId.peek() as string;
  // TODO: should we get 'entryGameState' from user?
  const finalGame =
    game ||
    (await joinTable(tableId, 1000, address, signAndSubmitTransaction, {
      decryptCardShareWasm,
      shuffleEncryptDeckWasm,
      decryptCardShareZkey,
      shuffleEncryptDeckZkey,
    }));
  setGameEventListeners(finalGame);
  const entryGameState = finalGame.gameState;
  if (!entryGameState) throw Error("should have existed");
  state$.gameState.players.set(entryGameState.players.map((p) => p));
  state$.gameState.status.set(entryGameState.status);
  state$.gameState.dealer.set(entryGameState.players[entryGameState.dealerIndex]!);
  if (entryGameState.shufflingPlayer) {
    state$.gameState.shufflingPlayer.set(entryGameState.shufflingPlayer);
  }
  state$.loading.set(false);
  //state$.initializing.set(false);
};

function setGameEventListeners(game: Jeton) {
  game.addListener?.(GameEventTypes.NEW_PLAYER_CHECK_IN, newPlayerCheckedInHandler);
  game.addListener?.(GameEventTypes.HAND_STARTED, handStartedHandler);
  game.addListener?.(GameEventTypes.PLAYER_SHUFFLING, playerShufflingHandler);
  game.addListener?.(GameEventTypes.PRIVATE_CARD_DECRYPTION_STARTED, privateCardsDecryptionHandler);
  game.addListener?.(GameEventTypes.RECEIVED_PRIVATE_CARDS, receivedPrivateCardHandler);
  game.addListener?.(GameEventTypes.AWAITING_BET, awaitingPlayerBetHandler);
  game.addListener?.(GameEventTypes.PLAYER_PLACED_BET, playerPlacedBetHandler);
  game.addListener?.(GameEventTypes.RECEIVED_PUBLIC_CARDS, receivedPublicCardsHandler);
  console.log("set game event listeners end");
}

export const setTableId = (id: string) => {
  state$.tableId.set(id);
};

export const setProgress = (percentage: number) => {
  state$.downloadingAssets.loadingProgress.set(percentage);
};
