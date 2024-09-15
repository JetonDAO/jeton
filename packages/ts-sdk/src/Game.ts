import { EventEmitter } from "events";
import type {
  InputTransactionData,
  SignMessagePayload,
  SignMessageResponse,
} from "@aptos-labs/wallet-adapter-core";

import {
  type PublicKey as ElGamalPublicKey,
  type ZKDeck,
  createZKDeck,
  decryptCardShareZkey,
  shuffleEncryptDeckZkey,
} from "@jeton/zk-deck";
//@ts-ignore
import decryptCardShareWasm from "@jeton/zk-deck/wasm/decrypt-card-share.wasm";
//@ts-ignore
import shuffleEncryptDeckWasm from "@jeton/zk-deck/wasm/shuffle-encrypt-deck.wasm";

import {
  type EntryGameState,
  type GameState,
  GameStatus,
  type HandState,
  type TableInfo,
  type offChainTransport,
} from "@src/types";
import type { OffChainEvents } from "@src/types/OffChainEvents";
import {
  type OnChainDataSource,
  OnChainEventTypes,
  type OnChainGameStartedData,
  type OnChainPlayerCheckedInData,
  type OnChainPrivateCardsSharesData,
  type OnChainShuffledDeckData,
} from "./OnChainDataSource";
import { getUrlBytes } from "./getURLBytes";
import { type GameEventMap, GameEventTypes } from "./types/GameEvents";
import { calculatePercentage } from "./utils/calculatePercentage";

export type GameConfigs = {
  offChainTransport: offChainTransport;
  tableInfo: TableInfo;
  address: string;
  signMessage: (message: SignMessagePayload) => Promise<SignMessageResponse>;
  signAndSubmitTransaction: (transaction: InputTransactionData) => Promise<void>;
  onChainDataSource: OnChainDataSource;
};

export class Game extends EventEmitter<GameEventMap> {
  private offChainTransport: offChainTransport;
  private onChainDataSource: OnChainDataSource;

  private tableInfo: TableInfo;
  private playerId: string;
  private signMessage: (message: SignMessagePayload) => Promise<SignMessageResponse>;
  private signAndSubmitTransaction: (transaction: InputTransactionData) => Promise<void>;
  // TODO: definitely assigned problem
  private zkDeck?: ZKDeck;
  private elGamalPublicKey?: ElGamalPublicKey;
  private elGamalSecretKey?: bigint;

  private creatingZKDeck: Promise<void>;

  private gameState: EntryGameState;

  private handState: HandState;

  constructor(config: GameConfigs) {
    super();
    // wallet address of the user
    this.playerId = config.address;

    this.signMessage = config.signMessage;
    this.signAndSubmitTransaction = config.signAndSubmitTransaction;
    this.offChainTransport = config.offChainTransport;
    this.tableInfo = config.tableInfo;
    this.onChainDataSource = config.onChainDataSource;
    this.handState = {};
    this.addOnChainListeners();
    // TODO
    this.gameState = {
      players: [],
      status: GameStatus.AwaitingStart,
      dealer: 0,
    };
    this.creatingZKDeck = this.createZKDeck();
  }

  private async createZKDeck() {
    const [decryptCardShareZkeyBytes, shuffleEncryptDeckZkeyBytes] = await this.downloadZkeyFiles();

    const zkDeck = await createZKDeck(
      new Uint8Array(shuffleEncryptDeckWasm),
      new Uint8Array(decryptCardShareWasm),
      shuffleEncryptDeckZkeyBytes,
      decryptCardShareZkeyBytes,
    );
    this.zkDeck = zkDeck;
    this.elGamalSecretKey = zkDeck.sampleSecretKey();
    this.elGamalPublicKey = zkDeck.generatePublicKey(this.elGamalSecretKey);
  }

  private addOnChainListeners() {
    this.onChainDataSource.on(OnChainEventTypes.PLAYER_CHECKED_IN, this.newPlayerCheckedIn);
    this.onChainDataSource.on(OnChainEventTypes.GAME_STARTED, this.gameStarted);
    this.onChainDataSource.on(OnChainEventTypes.SHUFFLED_DECK, this.playerShuffledDeck);
    this.onChainDataSource.on(
      OnChainEventTypes.PRIVATE_CARDS_SHARES_RECEIVED,
      this.receivedPrivateCardsShares,
    );
  }

  private receivedPrivateCardsShares = (data: OnChainPrivateCardsSharesData) => {
    // TODO:
  };

  private playerShuffledDeck = (data: OnChainShuffledDeckData) => {
    const nextPlayerToShuffle = this.getNextPlayer(data.player);
    if (!nextPlayerToShuffle) {
      this.gameState.status = GameStatus.DrawPrivateCards;
      this.emit(GameEventTypes.PRIVATE_CARD_DECRYPTION_STARTED, {});
      this.createAndSharePrivateKeyShares();
      return;
    }
    this.emit(GameEventTypes.PLAYER_SHUFFLING, nextPlayerToShuffle);
    if (nextPlayerToShuffle.id === this.playerId) {
      this.shuffle();
    }
  };

  // starting point refers to the number of players after the dealer
  private getNextPlayer(currentPlayerId: string, startingPoint = 0) {
    const numberOfPlayers = this.gameState.players.length;
    const dealerIndex = this.gameState.dealer;
    const startingPlayerIndex = (dealerIndex + startingPoint) % numberOfPlayers;
    const playerIndex = this.gameState.players.findIndex((p) => p.id === currentPlayerId);
    if (playerIndex === -1) throw new Error("could not find requested player");
    const nextPlayerIndex = (playerIndex + 1) % numberOfPlayers;
    if (nextPlayerIndex === startingPlayerIndex) return null;
    return this.gameState.players[nextPlayerIndex];
  }

  private amIDealer() {
    return this.playerId === this.gameState.players[this.gameState.dealer]?.id;
  }

  private gameStarted = (data: OnChainGameStartedData) => {
    this.handState = {};
    // TODO: check if we are in the right state
    this.gameState.status = GameStatus.Shuffle;
    this.gameState.dealer = data.dealerIndex;
    const dealerId = data.players[data.dealerIndex];
    const dealer = this.gameState.players.find((p) => p.id === dealerId);
    if (!dealer) throw new Error("could not find dealer in game state!!");
    const eventData = { dealer };
    this.emit(GameEventTypes.HAND_STARTED, eventData);
    if (eventData.dealer.id === this.playerId) {
      this.shuffle();
    }

    this.emit(GameEventTypes.PLAYER_SHUFFLING, dealer);
  };

  private newPlayerCheckedIn = (data: OnChainPlayerCheckedInData) => {
    if (data.address === this.playerId) return;
    const newPlayer = {
      id: data.address,
      balance: data.buyIn,
      elGamalPublicKey: data.elGamalPublicKey,
    };
    this.gameState?.players.push(newPlayer);

    // TODO: remove
    if (this.playerId === this.gameState?.players[0]?.id) {
      this.onChainDataSource.pieSocketTransport.publish("game-state", {
        receiver: data.address,
        state: this.gameState,
      });

      // call game start if there are enough people in the room people
      if (this.gameState.players.length === this.tableInfo.minPlayers) {
        setTimeout(() => {
          this.onChainDataSource.pieSocketTransport.publish(OnChainEventTypes.GAME_STARTED, {
            players: this.gameState.players.map((p) => p.id),
            dealerIndex: this.gameState.dealer,
          });
        }, 10 * 1000);
      }
    }

    this.emit(GameEventTypes.NEW_PLAYER_CHECK_IN, newPlayer);
  };

  private createAndSharePrivateKeyShares() {
    // TODO: create private shares
    this.onChainDataSource.privateCardsDecryptionShare(this.playerId);
  }

  private async shuffle() {
    if (!this.zkDeck) throw new Error("zkDeck must have been created by now!");
    const publicKeys = this.gameState.players.map((p) => p.elGamalPublicKey);
    const aggregatedPublicKey = this.zkDeck.generateAggregatedPublicKey(publicKeys);
    this.handState.aggregatedPublicKey = aggregatedPublicKey;
    const inputDeck = this.amIDealer()
      ? this.zkDeck.initialEncryptedDeck
      : await this.onChainDataSource.queryLastOutDeck(this.tableInfo.id);
    const st = new Date();
    const { proof, outputDeck } = await this.zkDeck.proveShuffleEncryptDeck(
      aggregatedPublicKey,
      inputDeck,
    );
    this.onChainDataSource.shuffledDeck(this.playerId, proof, outputDeck);
  }

  public async checkIn(buyIn: number): Promise<EntryGameState> {
    await this.creatingZKDeck;
    this.gameState = await this.callCheckInContract(buyIn);

    await this.initiateOffChainTransport();
    return this.gameState;
  }

  private async callCheckInContract(buyIn: number) {
    if (!this.elGamalPublicKey) throw new Error("you must first create elGamal keys");
    await this.onChainDataSource.checkIn(
      this.tableInfo.id,
      buyIn,
      this.playerId,
      this.elGamalPublicKey,
    );
    // first call checkIn transaction
    // then fetch game status
    return this.onChainDataSource.queryGameState();
  }

  private async initiateOffChainTransport() {
    await this.offChainTransport.create(this.tableInfo.id);
    this.offChainTransport.subscribe<OffChainEvents>("poker", (data) => {});
  }

  private async downloadZkeyFiles() {
    let decryptCardShareReceived = 0;
    let decryptCardShareTotal: number;
    let shuffleEncryptReceived = 0;
    let shuffleEncryptTotal: number;

    const [decryptCardShareZkeyBytes, shuffleEncryptDeckZkeyBytes] = await Promise.all([
      getUrlBytes(decryptCardShareZkey, (received, total) => {
        decryptCardShareReceived = received;
        decryptCardShareTotal = total;
        if (decryptCardShareTotal && shuffleEncryptTotal)
          this.emit(GameEventTypes.DOWNLOAD_PROGRESS, {
            percentage: calculatePercentage(
              [decryptCardShareReceived, shuffleEncryptReceived],
              [decryptCardShareTotal, shuffleEncryptTotal],
            ),
          });
      }),
      getUrlBytes(shuffleEncryptDeckZkey, (received, total) => {
        shuffleEncryptReceived = received;
        shuffleEncryptTotal = total;
        if (decryptCardShareTotal && shuffleEncryptTotal)
          this.emit(GameEventTypes.DOWNLOAD_PROGRESS, {
            percentage: calculatePercentage(
              [decryptCardShareReceived, shuffleEncryptReceived],
              [decryptCardShareTotal, shuffleEncryptTotal],
            ),
          });
      }),
    ]);

    return [decryptCardShareZkeyBytes, shuffleEncryptDeckZkeyBytes] as const;
  }
}

/*
proposed events for the game:

event checkedIn {players, balances, bets, gameState}

event playersChanged {players}
or
event playerCheckedIn {player, place, ...}
event playerCheckOut {player, place, ...}

event gameStateChanged {gameState: 'started' | 'paused'}
event handStarted {}
event Shuffle{}
event ShuffleFinished{}

event bettingRoundStarted {round: 'pre-flop', 'flop', 'turn', 'river'}
event betPlaced{player, bets, balances, }
or
event betPlaced{player, fullGameState }
event bettingRoundFinished{round}


event PrivateCardsOpened {cards}

event communityCardsOpened {round: 'flop', 'turn', 'river', cards}
*/
