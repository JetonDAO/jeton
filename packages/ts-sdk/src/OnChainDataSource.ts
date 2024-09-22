import { EventEmitter } from "events";
import type { GameState, PublicCardRounds } from ".";
import { PieSocketTransport } from "./transport";
import {
  type BettingActions,
  type BettingRounds,
  type CardShareAndProof,
  GameStatus,
  PlayerStatus,
} from "./types";

import type { PublicKey as ElGamalPublicKey, EncryptedDeck, Groth16Proof } from "@jeton/zk-deck";

export enum OnChainEventTypes {
  PLAYER_CHECKED_IN = "player-checked-in",
  GAME_STARTED = "game-started",
  SHUFFLED_DECK = "shuffled-deck",
  PRIVATE_CARDS_SHARES_RECEIVED = "private-cards-shares",
  PLAYER_PLACED_BET = "player-placed-bet",
  PUBLIC_CARDS_SHARES_RECEIVED = "public-cards-shares",
}

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
  proofs: CardShareAndProof[];
};

export type OnChainPlayerPlacedBetData = {
  bettingRound: BettingRounds;
  action: BettingActions;
  player: string;
};

export type OnChainPublicCardsSharesData = {
  sender: string;
  proofs: CardShareAndProof[];
  round: PublicCardRounds;
};

type OnChainEventMap = {
  [OnChainEventTypes.PLAYER_CHECKED_IN]: [OnChainPlayerCheckedInData];
  [OnChainEventTypes.GAME_STARTED]: [OnChainGameStartedData];
  [OnChainEventTypes.SHUFFLED_DECK]: [OnChainShuffledDeckData];
  [OnChainEventTypes.PRIVATE_CARDS_SHARES_RECEIVED]: [OnChainPrivateCardsSharesData];
  [OnChainEventTypes.PLAYER_PLACED_BET]: [OnChainPlayerPlacedBetData];
  [OnChainEventTypes.PUBLIC_CARDS_SHARES_RECEIVED]: [OnChainPublicCardsSharesData];
};

export class OnChainDataSource extends EventEmitter<OnChainEventMap> {
  pieSocketTransport: PieSocketTransport;
  gameState: GameState = { players: [], dealer: 0, status: GameStatus.AwaitingStart };
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
      (data: OnChainShuffledDeckData & { outDeck: EncryptedDeck }) => {
        this.outDeck = data.outDeck;
        this.emit(OnChainEventTypes.SHUFFLED_DECK, data);
      },
    );
    this.pieSocketTransport.subscribe(
      OnChainEventTypes.PRIVATE_CARDS_SHARES_RECEIVED,
      (data: OnChainPrivateCardsSharesData) => {
        //TODO: this is different in transactions
        this.emit(OnChainEventTypes.PRIVATE_CARDS_SHARES_RECEIVED, data);
      },
    );
    this.pieSocketTransport.subscribe(
      OnChainEventTypes.PLAYER_PLACED_BET,
      (data: OnChainPlayerPlacedBetData) => {
        this.emit(OnChainEventTypes.PLAYER_PLACED_BET, data);
      },
    );
    this.pieSocketTransport.subscribe(
      OnChainEventTypes.PUBLIC_CARDS_SHARES_RECEIVED,
      (data: OnChainPublicCardsSharesData) => {
        //TODO: this is different in transactions
        this.emit(OnChainEventTypes.PUBLIC_CARDS_SHARES_RECEIVED, data);
      },
    );

    if (this.gameState.players.length === 0) {
      this.gameState.players.push({
        id: address,
        balance: buyIn,
        elGamalPublicKey,
        status: PlayerStatus.active,
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

  async privateCardsDecryptionShare(id: string, proofs: CardShareAndProof[]) {
    this.pieSocketTransport.publish(OnChainEventTypes.PRIVATE_CARDS_SHARES_RECEIVED, {
      sender: id,
      proofs,
    });
  }

  async bet(round: BettingRounds, action: BettingActions) {
    this.pieSocketTransport.publish(OnChainEventTypes.PLAYER_PLACED_BET, {
      bettingRound: round,
      action,
      player: this.playerId,
    });
  }

  async publicCardsDecryptionShare(
    id: string,
    proofs: CardShareAndProof[],
    round: PublicCardRounds,
  ) {
    this.pieSocketTransport.publish(OnChainEventTypes.PRIVATE_CARDS_SHARES_RECEIVED, {
      sender: id,
      proofs,
      round,
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
