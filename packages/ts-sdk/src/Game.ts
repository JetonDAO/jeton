import { EventEmitter } from "events";
import type {
  InputTransactionData,
  SignMessagePayload,
  SignMessageResponse,
} from "@aptos-labs/wallet-adapter-core";

import {
  type DecryptionCardShare,
  type PublicKey as ElGamalPublicKey,
  type Groth16Proof,
  type ZKDeck,
  createZKDeck,
} from "@jeton/zk-deck";

import {
  type EntryGameState,
  type GameState,
  GameStatus,
  type HandState,
  type TableInfo,
  type offChainTransport,
} from "@src/types";
import type { OffChainEvents } from "@src/types/OffChainEvents";
import { CardShareProofSource } from "./CardShareProofSource";
import {
  type OnChainDataSource,
  OnChainEventTypes,
  type OnChainGameStartedData,
  type OnChainPlayerCheckedInData,
  type OnChainPrivateCardsSharesData,
  type OnChainShuffledDeckData,
} from "./OnChainDataSource";
import { getUrlBytes, readData } from "./getURLBytes";
import { type GameEventMap, GameEventTypes } from "./types/GameEvents";
import { calculatePercentage } from "./utils/calculatePercentage";

export type ZkDeckUrls = {
  shuffleEncryptDeckWasm: string;
  decryptCardShareWasm: string;
  shuffleEncryptDeckZkey: string;
  decryptCardShareZkey: string;
};

export type GameConfigs = {
  offChainTransport: offChainTransport;
  tableInfo: TableInfo;
  address: string;
  signMessage: (message: SignMessagePayload) => Promise<SignMessageResponse>;
  signAndSubmitTransaction: (transaction: InputTransactionData) => Promise<void>;
  onChainDataSource: OnChainDataSource;
  zkDeckFilesOrUrls: ZkDeckUrls;
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
    this.creatingZKDeck = this.createZKDeck(config.zkDeckFilesOrUrls);
  }

  private async createZKDeck(filesOrUrls: ZkDeckUrls) {
    const [
      decryptCardShareZkeyBytes,
      shuffleEncryptDeckZkeyBytes,
      decryptCardShareWasmBytes,
      shuffleEncryptDeckWasmBytes,
    ] = await this.downloadZkeyFiles(filesOrUrls);

    const zkDeck = await createZKDeck(
      shuffleEncryptDeckWasmBytes,
      decryptCardShareWasmBytes,
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
    if (!this.handState.privateCardShareProofs)
      throw new Error("CardShareProofSource must already be present");
    this.handState.privateCardShareProofs.addProofs(data.sender, data.proofs);
    const myPrivateCardIndexes = this.myPrivateCardIndexes;
    if (this.handState.privateCardShareProofs.receivedAllProofsFor(myPrivateCardIndexes)) {
      this.decryptMyPrivateCards();
    }
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

  get numberOfPlayers() {
    return this.gameState.players.length;
  }

  private get myDistanceFromDealer() {
    const myIndex = this.gameState.players.findIndex((p) => p.id === this.playerId);
    const dealerIndex = this.gameState.dealer;
    if (myIndex >= dealerIndex) {
      return myIndex - dealerIndex;
    }
    return myIndex + (this.numberOfPlayers - dealerIndex);
  }

  private get myPrivateCardIndexes() {
    return [this.myDistanceFromDealer * 2, this.myDistanceFromDealer * 2 + 1] as const;
  }

  private gameStarted = (data: OnChainGameStartedData) => {
    this.handState = {
      privateCardShareProofs: new CardShareProofSource(this.gameState.players),
    };
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

  private async createAndSharePrivateKeyShares() {
    if (!this.elGamalSecretKey) throw new Error("elGamal secret key should be present");
    if (!this.zkDeck) throw new Error("zkDeck should be present");
    if (!this.handState.privateCardShareProofs)
      throw new Error("CardShareProofSource must already be present");

    this.handState.finalOutDeck = await this.onChainDataSource.queryLastOutDeck(this.tableInfo.id);
    const numberOfCardsToCreateShareFor = this.numberOfPlayers * 2;

    const proofPromises: Promise<{
      proof: Groth16Proof;
      decryptionCardShare: DecryptionCardShare;
    }>[] = [];
    for (let i = 0; i < numberOfCardsToCreateShareFor; i += 1) {
      proofPromises.push(
        this.zkDeck.proveDecryptCardShare(this.elGamalSecretKey, i, this.handState.finalOutDeck),
      );
    }
    const proofsAndShares = (await Promise.all(proofPromises)).map((s, i) =>
      Object.assign({ cardIndex: i }, s),
    );

    this.handState.privateCardShareProofs.addProofs(this.playerId, proofsAndShares);

    const myPrivateCardsIndexes = this.myPrivateCardIndexes;
    const proofsToSend = proofsAndShares.filter(
      (pas) => !myPrivateCardsIndexes.includes(pas.cardIndex),
    );
    this.onChainDataSource.privateCardsDecryptionShare(this.playerId, proofsToSend);
  }

  private decryptMyPrivateCards() {
    if (!this.zkDeck) throw new Error("zkDeck must have been created by now!");
    if (!this.handState.privateCardShareProofs)
      throw new Error("CardShareProofSource must already be present");
    if (!this.handState.finalOutDeck) throw new Error("finalOutDeck must be present");

    const [firstCardIndex, secondCardIndex] = this.myPrivateCardIndexes;
    const proofsAndSharesOfFirstCard =
      this.handState.privateCardShareProofs.getProofsFor(firstCardIndex);
    const proofsAndSharesOfSecondCard =
      this.handState.privateCardShareProofs.getProofsFor(secondCardIndex);

    const firstPrivateCard = this.zkDeck?.decryptCard(
      firstCardIndex,
      this.handState.finalOutDeck,
      proofsAndSharesOfFirstCard.map((pas) => pas.decryptionCardShare),
    );

    const secondPrivateCard = this.zkDeck?.decryptCard(
      secondCardIndex,
      this.handState.finalOutDeck,
      proofsAndSharesOfSecondCard.map((pas) => pas.decryptionCardShare),
    );
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

  private async downloadZkeyFiles(urls: ZkDeckUrls) {
    let decryptCardShareReceived = 0;
    let decryptCardShareTotal: number;

    let shuffleEncryptReceived = 0;
    let shuffleEncryptTotal: number;

    const [
      decryptCardShareZkeyBytes,
      shuffleEncryptDeckZkeyBytes,
      decryptCardShareWasmBytes,
      shuffleEncryptDeckWasmBytes,
    ] = await Promise.all([
      getUrlBytes(urls.decryptCardShareZkey, (received, total) => {
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
      getUrlBytes(urls.shuffleEncryptDeckZkey, (received, total) => {
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
      readData(urls.decryptCardShareWasm),
      readData(urls.shuffleEncryptDeckWasm),
    ]);
    return [
      decryptCardShareZkeyBytes,
      shuffleEncryptDeckZkeyBytes,
      decryptCardShareWasmBytes,
      shuffleEncryptDeckWasmBytes,
    ] as const;
  }
}
