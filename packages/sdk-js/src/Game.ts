import { offChainEventFactory } from "@src/offChainEventFactory";
import {
  GameStatus,
  type GameState,
  type offChainTransport,
  type TableInfo,
} from "@src/types";
import type { OffChainEvents } from "@src/types/OffChainEvents";
import type {
  InputTransactionData,
  SignMessagePayload,
  SignMessageResponse,
} from "@aptos-labs/wallet-adapter-core";
import {
  OnChainEvents,
  type OnChainDataSource,
  type PlayerCheckedInData,
} from "./OnChaineDataSource";

export type GameConfigs = {
  offChainTransport: offChainTransport;
  tableInfo: TableInfo;
  address: string;
  signMessage: (message: SignMessagePayload) => Promise<SignMessageResponse>;
  signAndSubmitTransaction: (transaction: InputTransactionData) => Promise<any>;
  onChainDataSource: OnChainDataSource;
};

export class Game {
  private offChainTransport: offChainTransport;
  private onChainDataSource: OnChainDataSource;
  private tableInfo: TableInfo;
  private playerId: string;
  private signMessage: (
    message: SignMessagePayload,
  ) => Promise<SignMessageResponse>;
  private signAndSubmitTransaction: (
    transaction: InputTransactionData,
  ) => Promise<any>;
  private gameState?: GameState;

  constructor(config: GameConfigs) {
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
      OnChainEvents.PLAYER_CHECKED_IN,
      this.newPlayerCheckedIn,
    );
  }

  private newPlayerCheckedIn(data: PlayerCheckedInData) {
    console.log("new player checked in", data);
    this.gameState?.players.push({ id: data.address, balance: data.buyIn });

    // TODO: remove
    if (this.playerId === this.gameState?.players[0]?.id) {
      this.onChainDataSource.pieSocketTransport.publish("game-state", {
        receiver: this.playerId,
        state: this.gameState,
      });
    }
  }

  public async checkIn(buyIn: number): Promise<GameState> {
    this.gameState = await this.callCheckInContract(buyIn);
    console.log("checked in. game state is", this.gameState);

    await this.initiateOffChainTransport();
    // tell other players you checkedIn
    // this.offChainTransport.publish(
    //   "poker",
    //   offChainEventFactory.createCheckInEvent(playerId),
    // );
    // // we need this consensus algorithm for many different event too

    // wait until everyone acknowledge your checkIn
    // and construct full game state based on their responses

    return this.gameState;
  }

  private async callCheckInContract(buyIn: number) {
    this.onChainDataSource.checkIn(this.tableInfo.id, buyIn, this.playerId);
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
