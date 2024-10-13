import type { BettingActions, BettingRounds, PublicCardRounds } from "../types";

export enum OnChainEventTypes {
  PLAYER_CHECKED_IN = "player-checked-in",
  SHUFFLED_DECK = "shuffled-deck",
  CARDS_SHARES_RECEIVED = "cards-shares",
  PLAYER_PLACED_BET = "player-placed-bet",
  SHOW_DOWN = "show-down",
}

export type OnChainPlayerCheckedInData = {
  address: string;
};

export type OnChainShuffledDeckData = {
  address: string;
};

export type OnChainCardsSharesData = {
  address: string;
};

export type OnChainPlayerPlacedBetData = {
  action: BettingActions;
  address?: string;
};

export type OnChainShowDownData = {
  privateCards: number[];
  publicCards: number[];
  winningAmounts: number[];
};

export type OnChainEventMap = {
  [OnChainEventTypes.PLAYER_CHECKED_IN]: [OnChainPlayerCheckedInData];
  [OnChainEventTypes.SHUFFLED_DECK]: [OnChainShuffledDeckData];
  [OnChainEventTypes.CARDS_SHARES_RECEIVED]: [OnChainCardsSharesData];
  [OnChainEventTypes.PLAYER_PLACED_BET]: [OnChainPlayerPlacedBetData];
  [OnChainEventTypes.SHOW_DOWN]: [OnChainShowDownData];
};
