import type { BettingActions, BettingRounds, PublicCardRounds } from "../types";

export enum OnChainEventTypes {
  PLAYER_CHECKED_IN = "player-checked-in",
  GAME_STARTED = "game-started",
  SHUFFLED_DECK = "shuffled-deck",
  PRIVATE_CARDS_SHARES_RECEIVED = "private-cards-shares",
  PLAYER_PLACED_BET = "player-placed-bet",
  PUBLIC_CARDS_SHARES_RECEIVED = "public-cards-shares",
}

export type OnChainPlayerCheckedInData = {
  address: string;
};

export type OnChainGameStartedData = {
  dealerIndex: number;
};

export type OnChainShuffledDeckData = {
  address: string;
};

export type OnChainPrivateCardsSharesData = {
  address: string;
};

export type OnChainPlayerPlacedBetData = {
  bettingRound: BettingRounds;
  action: BettingActions;
  address: string;
};

export type OnChainPublicCardsSharesData = {
  sender: string;
  round: PublicCardRounds;
};

export type OnChainEventMap = {
  [OnChainEventTypes.PLAYER_CHECKED_IN]: [OnChainPlayerCheckedInData];
  [OnChainEventTypes.GAME_STARTED]: [OnChainGameStartedData];
  [OnChainEventTypes.SHUFFLED_DECK]: [OnChainShuffledDeckData];
  [OnChainEventTypes.PRIVATE_CARDS_SHARES_RECEIVED]: [OnChainPrivateCardsSharesData];
  [OnChainEventTypes.PLAYER_PLACED_BET]: [OnChainPlayerPlacedBetData];
  [OnChainEventTypes.PUBLIC_CARDS_SHARES_RECEIVED]: [OnChainPublicCardsSharesData];
};
