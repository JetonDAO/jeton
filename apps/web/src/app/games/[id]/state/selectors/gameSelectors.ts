import { state$ } from "../state";

export const selectIsGameLoading$ = () => state$.loading;
export const selectGamePlayers$ = () => state$.gameState.players;
export const selectGameStatus$ = () => state$.gameState.status;
export const selectShufflingPlayer$ = () => state$.gameState.shufflingPlayer;
export const selectDealer$ = () => state$.gameState.dealer;
export const selectMyCards$ = () => state$.gameState.myCards;
export const selectPot$ = () => state$.gameState.pot;
export const selectBetState$ = () => state$.gameState.betState;
export const selectAvailableActions$ = () => state$.gameState.betState?.availableActions ?? [];
export const selectAwaitingBetFrom$ = () => state$.gameState.betState?.awaitingBetFrom;
export const selectLastBet$ = () => state$.gameState.betState?.lastBet;
export const selectPublicCards$ = () => {
  const flopCards = state$.gameState.flopCards.get() || [];
  const turnCard = state$.gameState.turnCard.get() || [];
  const riverCard = state$.gameState.riverCard.get() || [];

  return [flopCards, turnCard, riverCard].flat();
};
