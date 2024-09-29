"use client";
import type {
  InputTransactionData,
  SignMessagePayload,
  SignMessageResponse,
} from "@aptos-labs/wallet-adapter-react";
import {} from "@jeton/ts-sdk";
import { GameEventTypes, type PlacingBettingActions, type Jeton } from "@jeton/ts-sdk";
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
  signMessage: (message: SignMessagePayload) => Promise<SignMessageResponse>,
  signAndSubmitTransaction: (transaction: InputTransactionData) => Promise<void>,
  joinTable: (typeof Jeton)["joinTable"],
) => {
  await when(
    () => state$.tableId.get() !== undefined && state$.loading.get() && !state$.initializing.get(),
  );
  state$.initializing.set(true);
  const tableId = state$.tableId.peek() as string;
  // TODO: should we get 'entryGameState' from user?
  const game = await joinTable(tableId, 1000, address, signAndSubmitTransaction, {
    decryptCardShareWasm,
    shuffleEncryptDeckWasm,
    decryptCardShareZkey,
    shuffleEncryptDeckZkey,
  });
  setGameEventListeners(game);
  console.log("reading gamestate", game);
  const entryGameState = game.gameState;
  console.log("inside app");
  if (!entryGameState) throw Error("should have existed");
  state$.gameState.players.set(entryGameState.seats.map((p) => p));
  state$.gameState.status.set(entryGameState.status);
  state$.gameState.dealer.set(entryGameState.seats[entryGameState.dealerIndex]!);
  state$.loading.set(false);
  state$.initializing.set(false);
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

export function placeBet(action: PlacingBettingActions) {
  state$.game.placeBet(action);
}
