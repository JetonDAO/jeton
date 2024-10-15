import type { Player } from "./Player";

export enum BettingRounds {
  PRE_FLOP = "pre-flop",
  FLOP = "flop",
  TURN = "turn",
  RIVER = "river",
}

export enum PlacingBettingActions {
  CHECK_CALL = "check-call",
  FOLD = "fold",
  RAISE = "raise",
}

export enum BettingActions {
  CHECK = "check",
  CALL = "call",
  RAISE = "raise",
  FOLD = "fold",
  SMALL_BLIND = "small-blind",
  BIG_BLIND = "big-blind",
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
