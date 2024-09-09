import type { Player } from "./Player";

export enum GameEventTypes {
  checkInEvent = "check-in",
  newPlayerCheckedIn = "new-player-checked-in",
  handStarted = "hand-started",
  playerShuffling = "player-shuffling",
  privateCardDecryptionStarted = "private-card-decryption-started",
}

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
  | CheckInEvent
  | NewPlayerCheckedInEvent
  | HandStartedEvent
  | playerShufflingEvent
  | PrivateCardDecryptionStarted;

export type GameEventMap = {
  [GameEventTypes.checkInEvent]: [CheckInEvent];
  [GameEventTypes.newPlayerCheckedIn]: [NewPlayerCheckedInEvent];
  [GameEventTypes.handStarted]: [HandStartedEvent];
  [GameEventTypes.playerShuffling]: [playerShufflingEvent];
  [GameEventTypes.privateCardDecryptionStarted]: [PrivateCardDecryptionStarted];
};
