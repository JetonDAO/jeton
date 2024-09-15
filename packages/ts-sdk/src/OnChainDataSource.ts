import { EventEmitter } from "events";
import type { EntryGameState, GameState } from ".";
import { PieSocketTransport } from "./transport";

export enum OnChainEventTypes {
  PLAYER_CHECKED_IN = "player-checked-in",
  GAME_STARTED = "game-started",
  SHUFFLED_DECK = "shuffled-deck",
  PRIVATE_CARDS_SHARES_RECEIVED = "private-cards-shares",
}
import type { PublicKey as ElGamalPublicKey, EncryptedDeck, Groth16Proof } from "@jeton/zk-deck";

export type OnChainPlayerCheckedInData = {
  buyIn: number;
  address: string;
  elGamalPublicKey: ElGamalPublicKey;
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
  gameState: EntryGameState = { players: [], dealer: 0, status: 0 };
  playerId = "";
  outDeck?: EncryptedDeck;

  constructor() {
    super();
    this.pieSocketTransport = new PieSocketTransport();
  }

  async checkIn(
    tableId: string,
    buyIn: number,
    address: string,
    elGamalPublicKey: ElGamalPublicKey,
  ) {
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
      (data: { receiver: string; state: EntryGameState }) => {
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
      (data: OnChainShuffledDeckData & { outDeck: EncryptedDeck }) => {
        this.outDeck = data.outDeck;
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
        elGamalPublicKey,
      });
    }
    this.pieSocketTransport.publish(OnChainEventTypes.PLAYER_CHECKED_IN, {
      tableId,
      buyIn,
      address,
      elGamalPublicKey,
    });
  }

  async shuffledDeck(address: string, proof: Groth16Proof, outDeck: EncryptedDeck) {
    this.pieSocketTransport.publish(OnChainEventTypes.SHUFFLED_DECK, {
      player: address,
      proof,
      outDeck,
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

  async queryLastOutDeck(tableId: string) {
    if (!this.outDeck) throw new Error("out deck must have been present!!");
    return this.outDeck;
  }
}
