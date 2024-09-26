import { state$ } from "../state";

export const selectIsGameLoading$ = () => state$.loading;
export const selectGamePlayers$ = () => state$.gameState.players;
export const selectGameStatus$ = () => state$.gameState.status;
export const selectShufflingPlayer$ = () => state$.gameState.shufflingPlayer;
export const selectMyCards$ = () => state$.gameState.myCards;
export const selectPot$ = () => state$.gameState.pot;
export const selectBetState$ = () => state$.gameState.betState;
export const selectAvailableActions$ = () => state$.gameState.betState?.availableActions ?? [];
export const selectAwaitingBetFrom$ = () => state$.gameState.betState?.awaitingBetFrom;
export const selectLastBet$ = () => state$.gameState.betState?.lastBet;
