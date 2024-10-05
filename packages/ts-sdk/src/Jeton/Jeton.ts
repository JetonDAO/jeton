import { EventEmitter } from "events";
import type { ZKDeck } from "@jeton/zk-deck";
import {
  type OnChainDataSource,
  type OnChainDataSourceInstance,
  OnChainEventTypes,
  type OnChainPlayerCheckedInData,
} from "@src/OnChainDataSource";
import { AptosOnChainDataSource } from "@src/OnChainDataSource/AptosOnChainDataSource";
import onChainDataMapper from "@src/OnChainDataSource/onChainDataMapper";
import type {
  ChipUnits,
  GameEventMap,
  GameStatus,
  PlacingBettingActions,
  Player,
  TableInfo,
} from "@src/types";
import { createLocalZKDeck } from "@src/utils/createZKDeck";

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

export type Seats = [Player | null];

export interface JGameState {
  seats: Seats;
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

  constructor(config: JetonConfigs) {
    super();
    // wallet address of the user
    this.playerId = config.address;

    this.tableInfo = config.tableInfo;
    this.onChainDataSource = config.onChainDataSource;
    this.zkDeck = config.zkDeck;
    this.secretKey = config.secretKey ?? this.zkDeck.sampleSecretKey();
    this.publicKey = this.zkDeck.generatePublicKey(this.secretKey);
  }

  async checkIn(buyInAmount: number) {
    console.log("check in, tableInfo", this.tableInfo);
    const rawState = await this.onChainDataSource.queryGameState(this.tableInfo.id, ["seets"]);
    const seats = onChainDataMapper.convertSeats(rawState.seets);
    const alreadyCheckedIn = this.isAlreadyCheckedIn(seats);

    if (!alreadyCheckedIn) {
      await this.onChainDataSource.checkIn(this.tableInfo.id, buyInAmount, this.publicKey);
    }

    const rawState2 = await this.onChainDataSource.queryGameState(this.tableInfo.id, [
      "seets",
      "dealer_index",
      "phase",
      "time_out",
    ]);
    this.gameState = onChainDataMapper.convertJetonState(rawState2) as JGameState;
    console.log("game state", this.gameState);
    this.setMySeatIndex();
    console.log("set seat index");
    this.addOnChainListeners();
  }

  private addOnChainListeners() {
    this.onChainDataSource.on(OnChainEventTypes.PLAYER_CHECKED_IN, this.newPlayerCheckedIn);
    //  this.onChainDataSource.on(OnChainEventTypes.GAME_STARTED, this.gameStarted);
    //  this.onChainDataSource.on(OnChainEventTypes.SHUFFLED_DECK, this.playerShuffledDeck);
    //  this.onChainDataSource.on(
    //    OnChainEventTypes.PRIVATE_CARDS_SHARES_RECEIVED,
    //    this.receivedPrivateCardsShares,
    //  );
    //  this.onChainDataSource.on(
    //    OnChainEventTypes.PUBLIC_CARDS_SHARES_RECEIVED,
    //    this.receivedPublicCardsShares,
    //  );
    //  this.onChainDataSource.on(OnChainEventTypes.PLAYER_PLACED_BET, this.receivedPlayerBet);
  }

  private newPlayerCheckedIn = (data: OnChainPlayerCheckedInData) => {
    console.log("new player checked in", data);
  };

  private setMySeatIndex() {
    if (!this.gameState) throw new Error("No game state");
    for (const [seat, player] of Object.entries(this.gameState.seats)) {
      if (player && player.id === this.playerId) {
        this.mySeatIndex = Number(seat);
        return;
      }
    }
  }

  private isAlreadyCheckedIn(seats: Seats): boolean {
    for (const player of seats) {
      if (player && player.id === this.playerId) return true;
    }
    return false;
  }

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
    const tableInfo = await onChainDataSource.createTable(
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
