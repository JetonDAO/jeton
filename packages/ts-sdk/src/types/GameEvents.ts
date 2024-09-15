import type { Player } from "./Player";

export enum GameEventTypes {
  checkInEvent = "check-in",
  newPlayerCheckedIn = "new-player-checked-in",
}

export type CheckInEvent = {
  playerId: string;
};

export type NewPlayerCheckedInEvent = Player;

export type GameEvents = CheckInEvent;

export type GameEventMap = {
  [GameEventTypes.checkInEvent]: [CheckInEvent];
  [GameEventTypes.newPlayerCheckedIn]: [NewPlayerCheckedInEvent];
};
