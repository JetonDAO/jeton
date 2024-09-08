import { EventEmitter } from "events";
import type {
  InputTransactionData,
  SignMessagePayload,
  SignMessageResponse,
} from "@aptos-labs/wallet-adapter-core";
import {
  type GameState,
  GameStatus,
  type TableInfo,
  type offChainTransport,
} from "@src/types";
import type { OffChainEvents } from "@src/types/OffChainEvents";
import {
  type OnChainDataSource,
  OnChainEventTypes,
  type OnChainPlayerCheckedInData,
} from "./OnChainDataSource";
import { type GameEventMap, GameEventTypes } from "./types/GameEvents";

export type GameConfigs = {
  offChainTransport: offChainTransport;
  tableInfo: TableInfo;
  address: string;
  signMessage: (message: SignMessagePayload) => Promise<SignMessageResponse>;
  signAndSubmitTransaction: (
    transaction: InputTransactionData,
  ) => Promise<void>;
  onChainDataSource: OnChainDataSource;
};

export class Game extends EventEmitter<GameEventMap> {
  private offChainTransport: offChainTransport;
  private onChainDataSource: OnChainDataSource;

  private tableInfo: TableInfo;
  private playerId: string;
  private signMessage: (
    message: SignMessagePayload,
  ) => Promise<SignMessageResponse>;
  private signAndSubmitTransaction: (
    transaction: InputTransactionData,
  ) => Promise<void>;

  private gameState: GameState;

  constructor(config: GameConfigs) {
    super();
    // wallet address of the user
    this.playerId = config.address;

    this.signMessage = config.signMessage;
    this.signAndSubmitTransaction = config.signAndSubmitTransaction;
    this.offChainTransport = config.offChainTransport;
    this.tableInfo = config.tableInfo;
    this.onChainDataSource = config.onChainDataSource;
    this.addOnChainListeners();
    // TODO
    this.gameState = {
      players: [],
      status: GameStatus.AwaitingStart,
      dealer: 0,
    };
  }

  private addOnChainListeners() {
    this.onChainDataSource.on(
      OnChainEventTypes.PLAYER_CHECKED_IN,
      this.newPlayerCheckedIn,
    );
  }

  private newPlayerCheckedIn = (data: OnChainPlayerCheckedInData) => {
    if (data.address === this.playerId) return;
    const newPlayer = { id: data.address, balance: data.buyIn };
    this.gameState?.players.push(newPlayer);

    // TODO: remove
    if (this.playerId === this.gameState?.players[0]?.id) {
      this.onChainDataSource.pieSocketTransport.publish("game-state", {
        receiver: data.address,
        state: this.gameState,
      });
    }

    this.emit(GameEventTypes.newPlayerCheckedIn, newPlayer);
  };

  public async checkIn(buyIn: number): Promise<GameState> {
    this.gameState = await this.callCheckInContract(buyIn);

    await this.initiateOffChainTransport();
    return JSON.parse(JSON.stringify(this.gameState));
  }

  private async callCheckInContract(buyIn: number) {
    await this.onChainDataSource.checkIn(
      this.tableInfo.id,
      buyIn,
      this.playerId,
    );
    // first call checkIn transaction
    // then fetch game status
    return this.onChainDataSource.queryGameState();
  }

  private async initiateOffChainTransport() {
    await this.offChainTransport.create(this.tableInfo.id);
    this.offChainTransport.subscribe<OffChainEvents>("poker", (data) => {});
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
