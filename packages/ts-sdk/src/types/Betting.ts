import type { Player } from "./Player";

export enum BettingRounds {
  PRE_FLOP = 0,
  FLOP,
  TURN,
  RIVER,
}

export enum PlacingBettingActions {
  CHECK_CALL = 0,
  FOLD,
  RAISE,
}

export enum BettingActions {
  CHECK = 0,
  CALL,
  RAISE,
  FOLD,
  ALL_IN,
  SMALL_BLIND,
  BIG_BLIND,
}

export interface BettingRound {
  active: boolean;
  round: BettingRounds;
  bets: Record<string, number>;
  numberOfRaises: number;
  afterLastToBet: Player;
  selfPlayerBettingState: {
    preemptivelyPlacedBet?: PlacingBettingActions | null;
    alreadySentForRound: boolean;
    awaitingBetPlacement: boolean;
  };
}
