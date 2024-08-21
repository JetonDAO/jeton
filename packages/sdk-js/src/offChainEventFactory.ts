import { type CheckInEvent, OffChainEventTypes } from "@src/types";

export const offChainEventFactory = {
  createCheckInEvent(playerId: string): CheckInEvent {
    return {
      type: OffChainEventTypes.checkInEvent,
      playerId,
    };
  },
};
