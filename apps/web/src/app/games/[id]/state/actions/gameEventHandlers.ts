import {
  type AwaitingBetEvent,
  GameStatus,
  type HandStartedEvent,
  type Player,
  type PlayerPlacedBetEvent,
  type ReceivedPrivateCardsEvent,
  getGameStatus,
  type playerShufflingEvent,
} from "@jeton/ts-sdk";
import type { ShowDownEvent } from "@jeton/ts-sdk";
import type { ReceivedPublicCardsEvent } from "@jeton/ts-sdk";
import { PublicCardRounds } from "@jeton/ts-sdk";
import { state$ } from "../state";

export function newPlayerCheckedInHandler(player: Player) {
  const gameState$ = state$.gameState;
  if (!gameState$.get()) throw new Error("game must exist in state");
  gameState$.players.push(player);
  console.log("players: ", gameState$.players.peek(), "new player: ", player);
}

export function handStartedHandler({ dealer }: HandStartedEvent) {
  console.log("hand started handler", dealer);
  const gameState$ = state$.gameState;
  gameState$.dealer.set(dealer);
  gameState$.status.set(GameStatus.Shuffle);
  gameState$.players.forEach((player) => {
    player.cards.set(undefined);
    player.bet.set(0);
    player.winAmount.set(undefined);
    player.roundAction.set(undefined);
  });
  gameState$.myCards.set(undefined);
  gameState$.flopCards.set(undefined);
  gameState$.riverCard.set(undefined);
  gameState$.turnCard.set(undefined);
  gameState$.pot.set(0);
  gameState$.betState.set(undefined);
}

export function playerShufflingHandler(player: playerShufflingEvent) {
  console.log("player shuffling handler");
  state$.gameState.shufflingPlayer.set(player);
  state$.gameState.status.set(GameStatus.Shuffle);
}

export function privateCardsDecryptionHandler() {
  state$.gameState.status.set(GameStatus.DrawPrivateCards);
  state$.gameState.shufflingPlayer.set(undefined);
}

export function receivedPrivateCardHandler({ cards }: ReceivedPrivateCardsEvent) {
  state$.gameState.status.set(GameStatus.BetPreFlop);
  state$.gameState.myCards.set(cards);
}

export function awaitingPlayerBetHandler({
  bettingRound,
  pot,
  bettingPlayer,
  availableActions,
}: AwaitingBetEvent) {
  console.log("awaiting bet", bettingRound, pot, bettingPlayer, availableActions);
  state$.gameState.status.set(getGameStatus(bettingRound));
  state$.gameState.pot.set(pot);
  if (!state$.gameState.betState.peek()) {
    state$.gameState.betState.set({ round: bettingRound, availableActions });
  }
  state$.gameState.betState.awaitingBetFrom.set(bettingPlayer);
  state$.gameState.betState.availableActions.set(availableActions);
}

export function playerPlacedBetHandler({
  bettingRound,
  player,
  potAfterBet,
  betAction,
  availableActions,
}: PlayerPlacedBetEvent) {
  console.log("placed bet", bettingRound, potAfterBet, betAction, availableActions);
  state$.gameState.status.set(getGameStatus(bettingRound));
  state$.gameState.pot.set(potAfterBet);
  if (!state$.gameState.betState.peek()) {
    state$.gameState.betState.set({ round: bettingRound, availableActions });
  }
  if (state$.gameState.betState.awaitingBetFrom.peek() === player) {
    state$.gameState.betState.awaitingBetFrom.set(undefined);
  }
  const player$ = state$.gameState.players.find((p) => p.id.peek() === player.id)!;
  player$.roundAction.action.set(betAction);
  player$.balance.set(player.balance);
  player$.bet.set(player.bet);
  player$.status.set(player.status);
  //TODO: calc amount
  player$.roundAction.amount.set(10);
  state$.gameState.betState.availableActions.set(availableActions);
}

export function clearPlayersRoundAction() {
  state$.gameState.players.forEach((player) => {
    player.roundAction.set(undefined);
  });
}

export function receivedPublicCardsHandler({ cards, round }: ReceivedPublicCardsEvent) {
  console.log("received public cards", round, cards);
  clearPlayersRoundAction();
  if (round === PublicCardRounds.FLOP) {
    state$.gameState.flopCards.set(cards);
  } else if (round === PublicCardRounds.RIVER) {
    state$.gameState.riverCard.set(cards);
  } else if (round === PublicCardRounds.TURN) {
    state$.gameState.turnCard.set(cards);
  }
}

export function receivedShowDown(data: ShowDownEvent) {
  console.log("received showdown event", data);
  state$.gameState.status.set(GameStatus.ShowDown);
  state$.gameState.players.forEach((player) => {
    const eventPlayer = data[player.id.get()!];
    if (eventPlayer) {
      player.cards.set(eventPlayer.cards);
      player.balance.set(eventPlayer.player.balance);
      player.bet.set(0);
      player.winAmount.set(eventPlayer.winAmount);
    }
  });
}
