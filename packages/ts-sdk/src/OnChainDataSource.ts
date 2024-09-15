import { EventEmitter } from "events";
import type { GameState } from ".";
import { PieSocketTransport } from "./transport";

export enum OnChainEventTypes {
  PLAYER_CHECKED_IN = "player-checked-in",
}

export type OnChainPlayerCheckedInData = {
  buyIn: number;
  address: string;
};

type OnChainEventMap = {
  [OnChainEventTypes.PLAYER_CHECKED_IN]: [OnChainPlayerCheckedInData];
};

export class OnChainDataSource extends EventEmitter<OnChainEventMap> {
  pieSocketTransport: PieSocketTransport;
  gameState: GameState = { players: [], dealer: 0 };

  constructor() {
    super();
    this.pieSocketTransport = new PieSocketTransport();
  }

  async checkIn(tableId: string, buyIn: number, address: string) {
    await this.pieSocketTransport.create(`onChain-${tableId}`);
    this.pieSocketTransport.subscribe(
      OnChainEventTypes.PLAYER_CHECKED_IN,
      (data: OnChainPlayerCheckedInData) => {
        this.emit(OnChainEventTypes.PLAYER_CHECKED_IN, data);
      },
    );
    if (this.gameState.players.length === 0) {
      this.gameState.players.push({
        id: address,
        balance: buyIn,
      });
    }
    this.pieSocketTransport.publish(OnChainEventTypes.PLAYER_CHECKED_IN, {
      tableId,
      buyIn,
      address,
    });

    this.pieSocketTransport.subscribe(
      "game-state",
      (data: { receiver: string; state: GameState }) => {
        if (data.receiver === address) {
          this.gameState = data.state;
        }
      },
    );
  }

  async queryGameState() {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return this.gameState;
  }
}
