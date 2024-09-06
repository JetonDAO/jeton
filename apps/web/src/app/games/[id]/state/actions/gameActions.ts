import { createGame, getTableInfo } from "@jeton/sdk-js";
import { when, whenReady } from "@legendapp/state";
import { state$ } from "../state";
import type {
  InputTransactionData,
  SignMessagePayload,
  SignMessageResponse,
} from "@aptos-labs/wallet-adapter-react";

export const initGame = async (
  address: string,
  signMessage: (message: SignMessagePayload) => Promise<SignMessageResponse>,
  signAndSubmitTransaction: (
    transaction: InputTransactionData,
  ) => Promise<void>,
) => {
  await when(
    () =>
      state$.tableId.get() !== undefined &&
      state$.loading.get() &&
      !state$.initializing.get(),
  );
  console.log("calling init game");
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
  const entryGameState = await game.checkIn(1000);
  state$.gameState.set(entryGameState);
  state$.loading.set(false);
  state$.initializing.set(false);
};

export const setTableId = (id: string) => {
  state$.tableId.set(id);
};
