export enum OffChainEventTypes {
  checkInEvent = 0,
}

export type CheckInEvent = {
  type: OffChainEventTypes.checkInEvent;
  playerId: string;
};

export type OffChainEvents = CheckInEvent;
