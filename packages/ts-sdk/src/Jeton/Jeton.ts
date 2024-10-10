import { EventEmitter } from "events";
import type { ZKDeck } from "@jeton/zk-deck";
import {
  type OnChainDataSourceInstance,
  OnChainEventTypes,
  type OnChainPlayerCheckedInData,
  type OnChainTableObject,
  type OnChainShuffledDeckData,
} from "@src/OnChainDataSource";
import { AptosOnChainDataSource } from "@src/OnChainDataSource/AptosOnChainDataSource";
import onChainDataMapper, { covertTableInfo } from "@src/OnChainDataSource/onChainDataMapper";
import {
  GameEventTypes,
  type ChipUnits,
  type GameEventMap,
  GameStatus,
  type PlacingBettingActions,
  type Player,
  type TableInfo,
} from "@src/types";
import { createLocalZKDeck } from "@src/utils/createZKDeck";
import { type PendingMemo, createPendingMemo } from "@src/utils/PendingMemo";
import { hexStringToUint8Array } from "@src/utils/unsignedInt";

export type ZkDeckUrls = {
  shuffleEncryptDeckWasm: string;
  decryptCardShareWasm: string;
  shuffleEncryptDeckZkey: string;
  decryptCardShareZkey: string;
};

export type JetonConfigs = {
  tableInfo: TableInfo;
  address: string;
  onChainDataSource: OnChainDataSourceInstance;
  zkDeck: ZKDeck;
  secretKey?: bigint;
};

export interface JGameState {
  players: Player[];
  dealerIndex: number;
  status: GameStatus;
}

export class Jeton extends EventEmitter<GameEventMap> {
  private playerId: string;
  public tableInfo: TableInfo;
  private onChainDataSource: OnChainDataSourceInstance;
  private zkDeck: ZKDeck;
  private secretKey: bigint;
  private publicKey: Uint8Array;
  public gameState?: JGameState;
  public mySeatIndex?: number;
  private pendingMemo: PendingMemo;

  constructor(config: JetonConfigs) {
    super();
    // wallet address of the user
    this.playerId = config.address;

    this.tableInfo = config.tableInfo;
    this.onChainDataSource = config.onChainDataSource;
    this.zkDeck = config.zkDeck;
    this.secretKey = config.secretKey ?? this.zkDeck.sampleSecretKey();
    this.publicKey = this.zkDeck.generatePublicKey(this.secretKey);

    this.pendingMemo = createPendingMemo();
  }

  async checkIn(buyInAmount: number) {
    console.log("check in, tableInfo", this.tableInfo);
    const rawState = await this.onChainDataSource.queryGameState(this.tableInfo.id);
    const gameState = onChainDataMapper.convertJetonState(rawState);
    const alreadyCheckedIn = this.isAlreadyCheckedIn(gameState.players);
    console.log("is already checked in?", alreadyCheckedIn, "  game state:", gameState);

    if (!alreadyCheckedIn) {
      await this.onChainDataSource.checkIn(this.tableInfo.id, buyInAmount, this.publicKey);
    }

    const updatedRawState = await this.onChainDataSource.queryGameState(this.tableInfo.id);
    this.gameState = onChainDataMapper.convertJetonState(updatedRawState);
    this.setMySeatIndex();
    console.log("my seat index is", this.mySeatIndex);
    this.addOnChainListeners();
    this.checkForActions(updatedRawState);
    this.createTableEvents(updatedRawState);
  }

  private createTableEvents(onChainTableObject: OnChainTableObject) {
    const shufflingPlayerIndex =
      onChainTableObject.state.__variant__ === "Playing" &&
      onChainTableObject.state.phase.__variant__ === "Shuffle" &&
      onChainTableObject.state.phase.turn_index;
    if (shufflingPlayerIndex === false) {
      console.log("shuffle ended, lets do private card decryption");
      return;
    }
    const shufflingPlayer = onChainTableObject.roster.players[shufflingPlayerIndex]!;
    this.emit(GameEventTypes.PLAYER_SHUFFLING, onChainDataMapper.convertPlayer(shufflingPlayer));
  }

  private addOnChainListeners() {
    this.onChainDataSource.on(OnChainEventTypes.PLAYER_CHECKED_IN, this.newPlayerCheckedIn);
    this.onChainDataSource.on(OnChainEventTypes.SHUFFLED_DECK, this.playerShuffledDeck);
    //  this.onChainDataSource.on(
    //    OnChainEventTypes.PRIVATE_CARDS_SHARES_RECEIVED,
    //    this.receivedPrivateCardsShares,
    //  );
    //  this.onChainDataSource.on(
    //    OnChainEventTypes.PUBLIC_CARDS_SHARES_RECEIVED,
    //    this.receivedPublicCardsShares,
    //  );
    //  this.onChainDataSource.on(OnChainEventTypes.PLAYER_PLACED_BET, this.receivedPlayerBet);
    this.onChainDataSource.listenToTableEvents(this.tableInfo.id);
  }

  private newPlayerCheckedIn = async (data: OnChainPlayerCheckedInData) => {
    if (!this.gameState) throw new Error("game state must exist");
    console.log("new player checked in", data);
    const onChainTableObject = await this.pendingMemo.memoize(this.queryGameState);
    const newJState = onChainDataMapper.convertJetonState(onChainTableObject);
    const newPlayer = newJState.players.find((p) => p.id === data.address);
    if (!newPlayer) throw new Error("new player must have existed!!");
    // TODO: are you sure? you want to replace all the players?
    // this.sendUIevents();
    this.emit(GameEventTypes.NEW_PLAYER_CHECK_IN, newPlayer);
    // this.takeAction();
    if (
      newJState.status === GameStatus.Shuffle &&
      this.gameState.status === GameStatus.AwaitingStart
    ) {
      const dealerIndex = newJState.dealerIndex;
      //@ts-ignore
      const shufflingPlayer = onChainTableObject.state?.phase?.turn_index;
      this.emit(GameEventTypes.HAND_STARTED, { dealer: newJState.players[dealerIndex]! });
      this.emit(GameEventTypes.PLAYER_SHUFFLING, newJState.players[shufflingPlayer]!);
      this.checkForActions(onChainTableObject);
    }

    // this.syncState(newGameState);
    this.gameState = newJState;
  };

  private async playerShuffledDeck(data: OnChainShuffledDeckData) {
    const onChainTableObject = await this.pendingMemo.memoize(this.queryGameState);
    const shufflingPlayerIndex =
      onChainTableObject.state.__variant__ === "Playing" &&
      onChainTableObject.state.phase.__variant__ === "Shuffle" &&
      onChainTableObject.state.phase.turn_index;
    if (shufflingPlayerIndex === false) {
      console.log("shuffle ended, lets do private card decryption");
      return;
    }
    const shufflingPlayer = onChainTableObject.roster.players[shufflingPlayerIndex]!;
    this.emit(GameEventTypes.PLAYER_SHUFFLING, onChainDataMapper.convertPlayer(shufflingPlayer));
    this.checkForActions(onChainTableObject);
  }

  private checkForActions(onChainTableObject: OnChainTableObject) {
    if (
      onChainTableObject.state.__variant__ === "Playing" &&
      onChainTableObject.state.phase.__variant__ === "Shuffle" &&
      onChainTableObject.roster.players[onChainTableObject.state.phase.turn_index]?.addr ===
        this.playerId
    ) {
      const publicKeys = onChainTableObject.roster.players.map((p) =>
        hexStringToUint8Array(p.public_key),
      );
      this.shuffle(hexStringToUint8Array(onChainTableObject.state.deck), publicKeys);
    }
  }

  private async shuffle(deck: Uint8Array, publicKeys: Uint8Array[]) {
    console.log("going to shuffle deck");
    if (!this.zkDeck) throw new Error("zkDeck must have been created by now!");
    if (!this.gameState) throw new Error("game state must be present");
    const aggregatedPublicKey = this.zkDeck.generateAggregatedPublicKey(publicKeys);
    const { proof, outputDeck } = await this.zkDeck.proveShuffleEncryptDeck(
      aggregatedPublicKey,
      deck,
    );
    console.log("shuffled deck", outputDeck);
    this.onChainDataSource.shuffledDeck(this.tableInfo.id, outputDeck, proof);
  }

  private setMySeatIndex() {
    if (!this.gameState) throw new Error("No game state");
    for (const [index, player] of Object.entries(this.gameState.players)) {
      if (player && player.id === this.playerId) {
        this.mySeatIndex = Number(index);
        return;
      }
    }
  }

  private isAlreadyCheckedIn(players: Player[]): boolean {
    for (const player of players) {
      if (player && player.id === this.playerId) return true;
    }
    return false;
  }

  private queryGameState = () => {
    return this.onChainDataSource.queryGameState(this.tableInfo.id);
  };

  public placeBet(action: PlacingBettingActions) {
    console.log("placeBet Called", action);
  }

  static async createTableAndJoin(
    smallBlind: number,
    // number of raises allowed in one round of betting
    numberOfRaises: number,
    // minimum number of players required to start the game
    minPlayers: number,
    // minimum amount a player is allowed to check in with
    minBuyIn: number,
    // maximum amount a player is allowed to check in with
    maxBuyIn: number,
    // how many seconds does each player have to act?
    waitingTimeOut: number,
    chipUnit: ChipUnits,
    buyInAmount: number,
    accountAddress: string,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    signAndSubmitTransaction: any,
    zkFiles: ZkDeckUrls,
  ) {
    console.log("Create table and join");
    const zkDeck = await createLocalZKDeck(zkFiles, ({ percentage }) => {
      console.log("downloading", percentage);
    });
    const secretKey = zkDeck.sampleSecretKey();
    const publicKey = zkDeck.generatePublicKey(secretKey);

    console.log("secret key", secretKey);
    const onChainDataSource: OnChainDataSourceInstance = new AptosOnChainDataSource(
      accountAddress,
      signAndSubmitTransaction,
    );
    const [tableAddress, tableObject] = await onChainDataSource.createTable(
      smallBlind,
      numberOfRaises,
      minPlayers,
      minBuyIn,
      maxBuyIn,
      buyInAmount,
      waitingTimeOut,
      chipUnit,
      publicKey,
    );
    const tableInfo = covertTableInfo(tableAddress, tableObject);

    const jeton = new Jeton({
      tableInfo,
      address: accountAddress,
      zkDeck,
      onChainDataSource,
      secretKey,
    });
    await jeton.checkIn(buyInAmount);
    return jeton;
  }

  static async joinTable(
    tableId: string,
    buyInAmount: number,
    accountAddress: string,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    signAndSubmitTransaction: any,
    zkFiles: ZkDeckUrls,
  ) {
    console.log("join table called");
    const zkDeck = await createLocalZKDeck(zkFiles, ({ percentage }) => {
      console.log("downloading", percentage);
    });

    const onChainDataSource: OnChainDataSourceInstance = new AptosOnChainDataSource(
      accountAddress,
      signAndSubmitTransaction,
    );

    const tableInfo = await AptosOnChainDataSource.getTableInfo(tableId);

    const jeton = new Jeton({ tableInfo, address: accountAddress, zkDeck, onChainDataSource });
    await jeton.checkIn(buyInAmount);
    console.log("returning jeton", jeton);
    return jeton;
  }
}
