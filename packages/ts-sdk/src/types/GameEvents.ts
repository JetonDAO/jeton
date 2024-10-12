import type { PublicCardRounds } from ".";
import type { BettingActions, BettingRounds, PlacingBettingActions } from "./Betting";
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
  RECEIVED_PUBLIC_CARDS = "received-public-cards",
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
export type ReceivedPublicCardsEvent =
  | {
      round: PublicCardRounds.FLOP;
      cards: [number, number, number];
    }
  | {
      round: PublicCardRounds.RIVER | PublicCardRounds.TURN;
      cards: [number];
    };

export type AwaitingBetEvent = {
  bettingRound: BettingRounds;
  pot: number;
  bettingPlayer: Player;
  availableActions: PlacingBettingActions[];
};

export type PlayerPlacedBetEvent = {
  bettingRound: BettingRounds;
  player: Player;
  potAfterBet: number;
  betAction: BettingActions;
  availableActions: PlacingBettingActions[];
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
  | PlayerPlacedBetEvent
  | ReceivedPublicCardsEvent;

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
  [GameEventTypes.RECEIVED_PUBLIC_CARDS]: [ReceivedPublicCardsEvent];
};
