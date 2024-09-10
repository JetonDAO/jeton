import type {
  InputTransactionData,
  SignMessagePayload,
  SignMessageResponse,
} from "@aptos-labs/wallet-adapter-react";
import { GameEventTypes, createGame, getTableInfo } from "@jeton/ts-sdk";
import { when } from "@legendapp/state";
import { state$ } from "../state";
import {
  handStartedHandler,
  newPlayerCheckedInHandler,
  playerShufflingHandler,
  privateCardsDecryptionHandler,
} from "./gameEventHandlers";

export const initGame = async (
  address: string,
  signMessage: (message: SignMessagePayload) => Promise<SignMessageResponse>,
  signAndSubmitTransaction: (transaction: InputTransactionData) => Promise<void>,
) => {
  await when(
    () => state$.tableId.get() !== undefined && state$.loading.get() && !state$.initializing.get(),
  );
  state$.initializing.set(true);
  const tableId = state$.tableId.peek() as string;
  const tableInfo = await getTableInfo(tableId);
  const game = createGame({
    address,
    tableInfo,
    signMessage,
    signAndSubmitTransaction,
  });
  state$.game.set(game);
  setGameEventListeners();
  const entryGameState = await game.checkIn(1000);
  state$.gameState.players.set(entryGameState.players.map((p) => p));
  state$.gameState.status.set(entryGameState.status);
  state$.gameState.dealer.set(entryGameState.players[entryGameState.dealer]);
  state$.loading.set(false);
  state$.initializing.set(false);
};

function setGameEventListeners() {
  const game = state$.game.peek();
  if (game === undefined) throw new Error("game must exist");
  game.addListener?.(GameEventTypes.NEW_PLAYER_CHECK_IN, newPlayerCheckedInHandler);
  game.addListener?.(GameEventTypes.HAND_STARTED, handStartedHandler);
  game.addListener?.(GameEventTypes.PLAYER_SHUFFLING, playerShufflingHandler);
  game.addListener?.(GameEventTypes.PRIVATE_CARD_DECRYPTION_STARTED, privateCardsDecryptionHandler);
}

export const setTableId = (id: string) => {
  state$.tableId.set(id);
};
