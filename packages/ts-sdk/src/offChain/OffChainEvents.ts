export enum OffChainEventTypes {
  checkInEvent = 0,
}

export type OffChainCheckInEvent = {
  type: OffChainEventTypes.checkInEvent;
  playerId: string;
};

export type OffChainEvents = OffChainCheckInEvent;
