import { EventEmitter } from "events";
import type { ZKDeck } from "@jeton/zk-deck";
import {
  type OnChainDataSourceInstance,
  OnChainEventTypes,
  type OnChainPlayerCheckedInData,
  type OnChainShuffledDeckData,
  type OnChainTableObject,
} from "@src/OnChainDataSource";
import { AptosOnChainDataSource } from "@src/OnChainDataSource/AptosOnChainDataSource";
import onChainDataMapper, { covertTableInfo } from "@src/OnChainDataSource/onChainDataMapper";
import {
  type ChipUnits,
  type GameEventMap,
  GameEventTypes,
  type GameStatus,
  type PlacingBettingActions,
  type Player,
  PlayerStatus,
  type TableInfo,
} from "@src/types";
import { type PendingMemo, createPendingMemo } from "@src/utils/PendingMemo";
import { createLocalZKDeck } from "@src/utils/createZKDeck";
import { hexStringToUint8Array } from "@src/utils/unsignedInt";
import { getShufflingPlayer, isActivePlayer } from "./helpers";

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
  shufflingPlayer: Player | null;
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
    this.addOnChainListeners();
    this.checkForActions(updatedRawState);
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
    //if (!this.gameState) throw new Error("game state must exist");
    console.log("new player checked in", data);
    const onChainTableObject = await this.pendingMemo.memoize(this.queryGameState);
    const newJState = onChainDataMapper.convertJetonState(onChainTableObject);
    const newPlayer = newJState.players.find((p) => p.id === data.address);
    if (!newPlayer) throw new Error("new player must have existed!!");
    // TODO: are you sure? you want to replace all the players?
    this.emit(GameEventTypes.NEW_PLAYER_CHECK_IN, newPlayer);

    // if the new player is active player then the game has just started
    if (newPlayer.status !== PlayerStatus.sittingOut) {
      const dealerIndex = newJState.dealerIndex;
      this.emit(GameEventTypes.HAND_STARTED, { dealer: newJState.players[dealerIndex]! });
      const shufflingPlayer = getShufflingPlayer(onChainTableObject);
      if (shufflingPlayer)
        this.emit(
          GameEventTypes.PLAYER_SHUFFLING,
          onChainDataMapper.convertPlayer(shufflingPlayer),
        );
      this.checkForActions(onChainTableObject);
    }

    this.gameState = newJState;
  };

  private async playerShuffledDeck(data: OnChainShuffledDeckData) {
    const onChainTableObject = await this.pendingMemo.memoize(this.queryGameState);
    const shufflingPlayer = getShufflingPlayer(onChainTableObject);
    if (!shufflingPlayer) {
      console.log("shuffle ended, lets do private card decryption");
      return;
    }
    this.emit(GameEventTypes.PLAYER_SHUFFLING, onChainDataMapper.convertPlayer(shufflingPlayer));
    this.checkForActions(onChainTableObject);
    this.gameState = onChainDataMapper.convertJetonState(onChainTableObject);
  }

  private checkForActions(onChainTableObject: OnChainTableObject) {
    if (getShufflingPlayer(onChainTableObject)?.addr === this.playerId) {
      if (onChainTableObject.state.__variant__ !== "Playing")
        throw new Error("shuffle should only be called during playing");
      const publicKeys = onChainTableObject.roster.players.map((p) =>
        hexStringToUint8Array(p.public_key),
      );
      this.shuffle(hexStringToUint8Array(onChainTableObject.state.deck), publicKeys);
    }
  }

  private async shuffle(deck: Uint8Array, publicKeys: Uint8Array[]) {
    console.log("going to shuffle deck");
    if (!this.zkDeck) throw new Error("zkDeck must have been created by now!");
    const aggregatedPublicKey = this.zkDeck.generateAggregatedPublicKey(publicKeys);
    const { proof, outputDeck } = await this.zkDeck.proveShuffleEncryptDeck(
      aggregatedPublicKey,
      deck,
    );
    console.log("shuffled deck", outputDeck);
    this.onChainDataSource.shuffledDeck(this.tableInfo.id, outputDeck, proof);
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
