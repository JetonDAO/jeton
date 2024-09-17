import type { BettingActions, BettingRounds } from "./Betting";
import type { Player } from "./Player";

export enum GameEventTypes {
  DOWNLOAD_PROGRESS = "download-progress-event",
  CHECK_IN_EVENT = "check-in",
  NEW_PLAYER_CHECK_IN = "new-player-checked-in",
  HAND_STARTED = "hand-started",
  PLAYER_SHUFFLING = "player-shuffling",
  PRIVATE_CARD_DECRYPTION_STARTED = "private-card-decryption-started",
  RECEIVED_PRIVATE_CARDS = "received-private-cards",
  AWAITING_BET = "awaiting-bet",
  PLAYER_PLACED_BET = "player-placed-bet",
}

export type DownloadProgressEvent = {
  percentage: number;
};

export type CheckInEvent = {
  playerId: string;
};

export type NewPlayerCheckedInEvent = Player;

export type HandStartedEvent = {
  dealer: Player;
};

// TODO: inconsistent namings
export type playerShufflingEvent = Player;

export type PrivateCardDecryptionStarted = Record<string, never>;

export type ReceivedPrivateCardsEvent = {
  cards: [number, number];
};

export type AwaitingBetEvent = {
  bettingRound: BettingRounds;
  pot: number[];
  bettingPlayer: Player;
};

export type PlayerPlacedBetEvent = {
  player: Player;
  potBeforeBet: number[];
  potAfterBet: number[];
  betAction: BettingActions;
  //my player available options
};

export type GameEvents =
  | DownloadProgressEvent
  | CheckInEvent
  | NewPlayerCheckedInEvent
  | HandStartedEvent
  | playerShufflingEvent
  | PrivateCardDecryptionStarted
  | ReceivedPrivateCardsEvent
  | AwaitingBetEvent
  | PlayerPlacedBetEvent;

export type GameEventMap = {
  [GameEventTypes.DOWNLOAD_PROGRESS]: [DownloadProgressEvent];
  [GameEventTypes.CHECK_IN_EVENT]: [CheckInEvent];
  [GameEventTypes.NEW_PLAYER_CHECK_IN]: [NewPlayerCheckedInEvent];
  [GameEventTypes.HAND_STARTED]: [HandStartedEvent];
  [GameEventTypes.PLAYER_SHUFFLING]: [playerShufflingEvent];
  [GameEventTypes.PRIVATE_CARD_DECRYPTION_STARTED]: [PrivateCardDecryptionStarted];
  [GameEventTypes.RECEIVED_PRIVATE_CARDS]: [ReceivedPrivateCardsEvent];
  [GameEventTypes.AWAITING_BET]: [AwaitingBetEvent];
  [GameEventTypes.PLAYER_PLACED_BET]: [PlayerPlacedBetEvent];
};
