import { state$ } from "../state";

export const selectIsGameLoading$ = () => state$.loading;

export const selectGamePlayers$ = () => state$.gameState.players;
