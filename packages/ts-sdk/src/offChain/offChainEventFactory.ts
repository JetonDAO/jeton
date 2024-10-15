import { type OffChainCheckInEvent, OffChainEventTypes } from "./OffChainEvents";

export const offChainEventFactory = {
  createCheckInEvent(playerId: string): OffChainCheckInEvent {
    return {
      type: OffChainEventTypes.checkInEvent,
      playerId,
    };
  },
};
