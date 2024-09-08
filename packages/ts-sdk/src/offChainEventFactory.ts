import { type OffChainCheckInEvent, OffChainEventTypes } from "@src/types";

export const offChainEventFactory = {
  createCheckInEvent(playerId: string): OffChainCheckInEvent {
    return {
      type: OffChainEventTypes.checkInEvent,
      playerId,
    };
  },
};
