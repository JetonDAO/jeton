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

import { getUrlBytes, readData } from "./getURLBytes";

import { GameStatus, type TableInfo } from "./types";

import type { PollingDataSource } from "./PollingDataSource";
import {
  type GameEventMap,
  GameEventTypes,
  type ReceivedPublicCardsEvent,
} from "./types/GameEvents";
import type { WholeGameState } from "./types/WholeGameState";
import { calculatePercentage } from "./utils/calculatePercentage";

export type ZkDeckUrls = {
  shuffleEncryptDeckWasm: string;
  decryptCardShareWasm: string;
  shuffleEncryptDeckZkey: string;
  decryptCardShareZkey: string;
};
export type GameConfigs = {
  tableInfo: TableInfo;
  address: string;
  signMessage: (message: SignMessagePayload) => Promise<SignMessageResponse>;
  signAndSubmitTransaction: (transaction: InputTransactionData) => Promise<void>;
  onChainDataSource: PollingDataSource;
  zkDeckFilesOrUrls: ZkDeckUrls;
};

export class PollingGame extends EventEmitter {
  private onChainDataSource: PollingDataSource;

  private tableInfo: TableInfo;
  private playerId: string;
  private signMessage: (message: SignMessagePayload) => Promise<SignMessageResponse>;
  private signAndSubmitTransaction: (transaction: InputTransactionData) => Promise<void>;
  // TODO: definitely assigned problem
  private zkDeck?: ZKDeck;
  private elGamalPublicKey?: ElGamalPublicKey;
  private elGamalSecretKey?: bigint;
  private mySeatIndex?: string;

  private creatingZKDeck: Promise<void>;

  private gameState?: WholeGameState;

  constructor(config: GameConfigs) {
    super();
    // wallet address of the user
    this.playerId = config.address;

    this.signMessage = config.signMessage;
    this.signAndSubmitTransaction = config.signAndSubmitTransaction;

    this.tableInfo = config.tableInfo;
    this.onChainDataSource = config.onChainDataSource;
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

  private isAlreadyCheckedIn(state: WholeGameState): boolean {
    //TODO:
    for (const player of Object.values(state.seats)) {
      if (player.id === this.playerId) return true;
    }
    return false;
  }

  private receivedGameState = (newState: WholeGameState) => {
    // TODO: player events?!!
    if (newState.gameStatus === GameStatus.AwaitingStart) {
      return;
    } else if(newState.gameStatus === GameStatus.Shuffle && newState.)
  };

  private setMySeatIndex() {
    if (!this.gameState) throw new Error("No game state");
    for (const [seat, player] of Object.entries(this.gameState.seats)) {
      if (player.id === this.playerId) {
        this.mySeatIndex = seat;
        return;
      }
    }
  }

  public async checkIn(buyIn?: number) {
    await this.creatingZKDeck;
    if (!this.elGamalPublicKey) throw new Error("you must first create elGamal keys");

    const currentGameState = await this.onChainDataSource.getGameState();
    const alreadyCheckedIn = this.isAlreadyCheckedIn(currentGameState);

    if (buyIn && !alreadyCheckedIn) {
      await this.onChainDataSource.checkIn(this.tableInfo.id, buyIn, this.elGamalPublicKey);
    } else if (!alreadyCheckedIn && !buyIn) {
      throw new Error("Game Error");
    }

    this.onChainDataSource.pollGameState(this.receivedGameState);
    this.gameState = await this.onChainDataSource.getGameState();
    this.setMySeatIndex();
    // TODO: return game state to ui
    this.receivedGameState(this.gameState);
  }
}
