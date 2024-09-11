import { state$ } from "../state";
//TODO: these types should work
export const selectIsGameLoading$ = () => state$.loading;

export const selectGamePlayers$ = () => state$.gameState.players;
export const selectGameStatus$ = () => state$.gameState.status;
export const selectShufflingPlayer$ = () => state$.gameState.shufflingPlayer;
