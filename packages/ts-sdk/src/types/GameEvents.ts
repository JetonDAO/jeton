import type { Player } from "./Player";

export enum GameEventTypes {
  DOWNLOAD_PROGRESS = "download-progress-event",
  CHECK_IN_EVENT = "check-in",
  NEW_PLAYER_CHECK_IN = "new-player-checked-in",
  HAND_STARTED = "hand-started",
  PLAYER_SHUFFLING = "player-shuffling",
  PRIVATE_CARD_DECRYPTION_STARTED = "private-card-decryption-started",
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

export type playerShufflingEvent = Player;

export type PrivateCardDecryptionStarted = Record<string, never>;

export type GameEvents =
  | DownloadProgressEvent
  | CheckInEvent
  | NewPlayerCheckedInEvent
  | HandStartedEvent
  | playerShufflingEvent
  | PrivateCardDecryptionStarted;

export type GameEventMap = {
  [GameEventTypes.DOWNLOAD_PROGRESS]: [DownloadProgressEvent];
  [GameEventTypes.CHECK_IN_EVENT]: [CheckInEvent];
  [GameEventTypes.NEW_PLAYER_CHECK_IN]: [NewPlayerCheckedInEvent];
  [GameEventTypes.HAND_STARTED]: [HandStartedEvent];
  [GameEventTypes.PLAYER_SHUFFLING]: [playerShufflingEvent];
  [GameEventTypes.PRIVATE_CARD_DECRYPTION_STARTED]: [PrivateCardDecryptionStarted];
};
