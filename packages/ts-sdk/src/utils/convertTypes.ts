import { BettingRounds, GameStatus, PublicCardRounds } from "../types";

export function getNextBettingRound(round: PublicCardRounds) {
  switch (round) {
    case PublicCardRounds.FLOP:
      return BettingRounds.FLOP;
    case PublicCardRounds.TURN:
      return BettingRounds.TURN;
    case PublicCardRounds.RIVER:
      return BettingRounds.RIVER;
  }
}

export function getGameStatus(round: BettingRounds) {
  switch (round) {
    case BettingRounds.PRE_FLOP:
      return GameStatus.BetPreFlop;
    case BettingRounds.FLOP:
      return GameStatus.BetFlop;
    case BettingRounds.TURN:
      return GameStatus.BetTurn;
    case BettingRounds.RIVER:
      return GameStatus.BetRiver;
  }
}

export function getGameStatusForPublicCard(round: PublicCardRounds) {
  switch (round) {
    case PublicCardRounds.FLOP:
      return GameStatus.DrawFlop;
    case PublicCardRounds.TURN:
      return GameStatus.DrawTurn;
    case PublicCardRounds.RIVER:
      return GameStatus.DrawRiver;
  }
}
export function getNextPublicCardRound(round: BettingRounds) {
  switch (round) {
    case BettingRounds.PRE_FLOP:
      return PublicCardRounds.FLOP;
    case BettingRounds.FLOP:
      return PublicCardRounds.TURN;
    case BettingRounds.TURN:
      return PublicCardRounds.RIVER;
    case BettingRounds.RIVER:
      return null;
  }
}
