import { EventEmitter } from "events";
import type { InputTransactionData, SignMessagePayload, SignMessageResponse } from "@aptos-labs/wallet-adapter-core";
import { type GameState, GameStatus, type TableInfo, type offChainTransport } from "@src/types";
import type { OffChainEvents } from "@src/types/OffChainEvents";
import {
  type OnChainDataSource,
  OnChainEventTypes,
  type OnChainGameStartedData,
  type OnChainPlayerCheckedInData,
  type OnChainPrivateCardsSharesData,
  type OnChainShuffledDeckData,
} from "./OnChainDataSource";
import { type GameEventMap, GameEventTypes } from "./types/GameEvents";

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
    this.onChainDataSource.on(OnChainEventTypes.PLAYER_CHECKED_IN, this.newPlayerCheckedIn);
    this.onChainDataSource.on(OnChainEventTypes.GAME_STARTED, this.gameStarted);
    this.onChainDataSource.on(OnChainEventTypes.SHUFFLED_DECK, this.playerShuffledDeck);
    this.onChainDataSource.on(OnChainEventTypes.PRIVATE_CARDS_SHARES_RECEIVED, this.receivedPrivateCardsShares);
  }

  private receivedPrivateCardsShares = (data: OnChainPrivateCardsSharesData) => {
    // TODO:
  };

  private playerShuffledDeck = (data: OnChainShuffledDeckData) => {
    const nextPlayerToShuffle = this.getNextPlayer(data.player);
    if (!nextPlayerToShuffle) {
      this.gameState.status = GameStatus.DrawPrivateCards;
      this.emit(GameEventTypes.privateCardDecryptionStarted, {});
      this.createAndSharePrivateKeyShares();
      return;
    }
    this.emit(GameEventTypes.playerShuffling, nextPlayerToShuffle);
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

  private gameStarted = (data: OnChainGameStartedData) => {
    // TODO: check if we are in the right state
    this.gameState.status = GameStatus.Shuffle;
    this.gameState.dealer = data.dealerIndex;
    const dealerId = data.players[data.dealerIndex];
    const dealer = this.gameState.players.find((p) => p.id === dealerId);
    if (!dealer) throw new Error("could not find dealer in game state!!");
    const eventData = { dealer };
    this.emit(GameEventTypes.handStarted, eventData);
    if (eventData.dealer.id === this.playerId) {
      this.shuffle();
    }

    this.emit(GameEventTypes.playerShuffling, dealer);
  };

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

    this.emit(GameEventTypes.newPlayerCheckedIn, newPlayer);
  };

  private createAndSharePrivateKeyShares() {
    // TODO: create private shares
    this.onChainDataSource.privateCardsDecryptionShare(this.playerId);
  }

  private shuffle() {
    // TODO: create Deck o ina
    setTimeout(() => {
      this.onChainDataSource.shuffledDeck(this.playerId);
    }, 10 * 1000);
  }

  public async checkIn(buyIn: number): Promise<GameState> {
    this.gameState = await this.callCheckInContract(buyIn);

    await this.initiateOffChainTransport();
    return this.gameState;
  }

  private async callCheckInContract(buyIn: number) {
    await this.onChainDataSource.checkIn(this.tableInfo.id, buyIn, this.playerId);
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
