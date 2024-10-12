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

export function getBettingRound(status: GameStatus) {
  switch (status) {
    case GameStatus.BetPreFlop:
    case GameStatus.DrawFlop:
      return BettingRounds.PRE_FLOP;
    case GameStatus.BetFlop:
    case GameStatus.DrawTurn:
      return BettingRounds.FLOP;
    case GameStatus.BetTurn:
    case GameStatus.DrawRiver:
      return BettingRounds.TURN;
    case GameStatus.BetRiver:
    case GameStatus.ShowDown:
      return BettingRounds.RIVER;
    default:
      throw new Error("not a betting round");
  }
}

export function getPublicCardRound(status: GameStatus) {
  switch (status) {
    case GameStatus.DrawFlop:
      return PublicCardRounds.FLOP;
    case GameStatus.DrawRiver:
      return PublicCardRounds.RIVER;
    case GameStatus.DrawTurn:
      return PublicCardRounds.TURN;
    default:
      throw new Error("not in public card round");
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
