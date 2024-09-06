import EventEmitter from "events";
import { PieSocketTransport } from "./transport";
import type { GameState } from ".";

export enum OnChainEvents {
  PLAYER_CHECKED_IN = "player-checked-in",
}

export type PlayerCheckedInData = {
  buyIn: number;
  address: string;
};

type OnChainEventData = PlayerCheckedInData;

export class OnChainDataSource extends EventEmitter {
  pieSocketTransport: PieSocketTransport;
  gameState: GameState = { players: [], dealer: 0 };
  constructor() {
    super();
    this.pieSocketTransport = new PieSocketTransport();
  }

  async checkIn(tableId: string, buyIn: number, address: string) {
    await this.pieSocketTransport.create(`onChain-${tableId}`);
    this.pieSocketTransport.subscribe(
      OnChainEvents.PLAYER_CHECKED_IN,
      (data: PlayerCheckedInData) => {
        console.log("onchaindatasource: player checked in ");
        this.emit(OnChainEvents.PLAYER_CHECKED_IN, data);
      },
    );
    if (this.gameState.players.length === 0) {
      this.gameState.players.push({
        id: address,
        balance: buyIn,
      });
    }
    this.pieSocketTransport.publish(OnChainEvents.PLAYER_CHECKED_IN, {
      tableId,
      buyIn,
      address,
    });

    this.pieSocketTransport.subscribe(
      "game-state",
      (data: { receiver: string; state: GameState }) => {
        console.log("received game state");
        if (data.receiver === address) {
          this.gameState = data.state;
        }
      },
    );
  }

  async queryGameState() {
    console.log("query game state");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("query game state returning", this.gameState);
    return this.gameState;
  }
}
