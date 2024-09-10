import { EventEmitter } from "events";
import type { GameState } from ".";
import { PieSocketTransport } from "./transport";

export enum OnChainEventTypes {
  PLAYER_CHECKED_IN = "player-checked-in",
  GAME_STARTED = "game-started",
  SHUFFLED_DECK = "shuffled-deck",
  PRIVATE_CARDS_SHARES_RECEIVED = "private-cards-shares",
}

export type OnChainPlayerCheckedInData = {
  buyIn: number;
  address: string;
};

export type OnChainGameStartedData = {
  players: string[];
  dealerIndex: number;
};

export type OnChainShuffledDeckData = {
  player: string;
};

export type OnChainPrivateCardsSharesData = {
  sender: string;
};

type OnChainEventMap = {
  [OnChainEventTypes.PLAYER_CHECKED_IN]: [OnChainPlayerCheckedInData];
  [OnChainEventTypes.GAME_STARTED]: [OnChainGameStartedData];
  [OnChainEventTypes.SHUFFLED_DECK]: [OnChainShuffledDeckData];
  [OnChainEventTypes.PRIVATE_CARDS_SHARES_RECEIVED]: [OnChainPrivateCardsSharesData];
};

export class OnChainDataSource extends EventEmitter<OnChainEventMap> {
  pieSocketTransport: PieSocketTransport;
  gameState: GameState = { players: [], dealer: 0, status: 0 };
  playerId = "";

  constructor() {
    super();
    this.pieSocketTransport = new PieSocketTransport();
  }

  async checkIn(tableId: string, buyIn: number, address: string) {
    await this.pieSocketTransport.create(`onChain-${tableId}`);
    this.playerId = address;
    // subscribe to needed events
    this.pieSocketTransport.subscribe(
      OnChainEventTypes.PLAYER_CHECKED_IN,
      (data: OnChainPlayerCheckedInData) => {
        this.emit(OnChainEventTypes.PLAYER_CHECKED_IN, data);
      },
    );
    this.pieSocketTransport.subscribe(
      "game-state",
      (data: { receiver: string; state: GameState }) => {
        if (data.receiver === address) {
          this.gameState = data.state;
        }
      },
    );
    this.pieSocketTransport.subscribe(
      OnChainEventTypes.GAME_STARTED,
      (data: OnChainGameStartedData) => {
        this.emit(OnChainEventTypes.GAME_STARTED, data);
      },
    );

    this.pieSocketTransport.subscribe(
      OnChainEventTypes.SHUFFLED_DECK,
      (data: OnChainShuffledDeckData) => {
        this.emit(OnChainEventTypes.SHUFFLED_DECK, data);
      },
    );
    this.pieSocketTransport.subscribe(
      OnChainEventTypes.PRIVATE_CARDS_SHARES_RECEIVED,
      (data: OnChainPrivateCardsSharesData) => {
        // this is sooo toff
        if (data.sender === this.playerId) {
          this.emit(OnChainEventTypes.PRIVATE_CARDS_SHARES_RECEIVED, data);
        }
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
  }

  async shuffledDeck(address: string) {
    this.pieSocketTransport.publish(OnChainEventTypes.SHUFFLED_DECK, {
      player: address,
    });
  }

  async privateCardsDecryptionShare(id: string) {
    this.pieSocketTransport.publish(OnChainEventTypes.PRIVATE_CARDS_SHARES_RECEIVED, {
      sender: id,
    });
  }

  async queryGameState() {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return this.gameState;
  }
}
