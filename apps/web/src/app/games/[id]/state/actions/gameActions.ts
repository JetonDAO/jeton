import { createGame } from "@jeton/sdk-js";
import { when, whenReady } from "@legendapp/state";
import { state$ } from "../state";

export const initGame = async () => {
  await when(() => state$.tableId.get() !== undefined && state$.loading);
  const tableId = state$.tableId.peek() as string;
  const game = createGame({ tableId: tableId });
  state$.game.set(game);
  const entryGameState = await game.checkIn(`ali ${Math.random()}`);
  state$.gameState.set(entryGameState);
  state$.loading.set(false);
};

export const setTableId = (id: string) => {
  state$.tableId.set(id);
};
