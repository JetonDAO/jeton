import { EventEmitter } from "events";
import type {
  InputTransactionData,
  SignMessagePayload,
  SignMessageResponse,
} from "@aptos-labs/wallet-adapter-core";

import {
  type DecryptionCardShare,
  type PublicKey as ElGamalPublicKey,
  type Proof,
  type ZKDeck,
  createZKDeck,
} from "@jeton/zk-deck";

import type { OffChainEvents, offChainTransport } from "@src/offChain";
import {
  BettingActions,
  BettingRounds,
  type GameState,
  GameStatus,
  type HandState,
  type PlacingBettingActions,
  type Player,
  PlayerStatus,
  PublicCardRounds,
  type TableInfo,
} from "@src/types";
import { calculatePercentage } from "@src/utils/calculatePercentage";
import { getUrlBytes, readData } from "@src/utils/getURLBytes";
import {
  type MockOnChainDataSource,
  OnChainEventTypes,
  type OnChainGameStartedData,
  type OnChainPlayerCheckedInData,
  type OnChainPlayerPlacedBetData,
  type OnChainPrivateCardsSharesData,
  type OnChainPublicCardsSharesData,
  type OnChainShuffledDeckData,
} from "../OnChainDataSource/MockOnChainDataSource";
import {
  type GameEventMap,
  GameEventTypes,
  type ReceivedPublicCardsEvent,
} from "@src/types/GameEvents";
import {
  getGameStatus,
  getGameStatusForPublicCard,
  getNextBettingRound,
  getNextPublicCardRound,
} from "@src/utils/convertTypes";
import { BettingManager } from "./BettingManager";
import { CardShareProofSource } from "./CardShareProofSource";

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
  onChainDataSource: MockOnChainDataSource;
  zkDeckFilesOrUrls: ZkDeckUrls;
};

export class Game extends EventEmitter<GameEventMap> {
  private offChainTransport: offChainTransport;
  private onChainDataSource: MockOnChainDataSource;

  private tableInfo: TableInfo;
  private playerId: string;
  private signMessage: (message: SignMessagePayload) => Promise<SignMessageResponse>;
  private signAndSubmitTransaction: (transaction: InputTransactionData) => Promise<void>;
  // TODO: definitely assigned problem
  private zkDeck?: ZKDeck;
  private elGamalPublicKey?: ElGamalPublicKey;
  private elGamalSecretKey?: bigint;

  private creatingZKDeck: Promise<void>;

  private gameState: GameState;

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
    this.handState = { pot: [] };
    this.addOnChainListeners();
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

  public getRaiseAmount() {
    return this.handState.bettingManager?.raiseAmount;
  }

  private addOnChainListeners() {
    this.onChainDataSource.on(OnChainEventTypes.PLAYER_CHECKED_IN, this.newPlayerCheckedIn);
    this.onChainDataSource.on(OnChainEventTypes.GAME_STARTED, this.gameStarted);
    this.onChainDataSource.on(OnChainEventTypes.SHUFFLED_DECK, this.playerShuffledDeck);
    this.onChainDataSource.on(
      OnChainEventTypes.PRIVATE_CARDS_SHARES_RECEIVED,
      this.receivedPrivateCardsShares,
    );
    this.onChainDataSource.on(
      OnChainEventTypes.PUBLIC_CARDS_SHARES_RECEIVED,
      this.receivedPublicCardsShares,
    );
    this.onChainDataSource.on(OnChainEventTypes.PLAYER_PLACED_BET, this.receivedPlayerBet);
  }

  private receivedPublicCardsShares = (data: OnChainPublicCardsSharesData) => {
    if (!this.handState.privateCardShareProofs)
      throw new Error("CardShareProofSource must already be present");
    const cardIndexes = this.getCardIndexForRound(data.round);
    this.handState.privateCardShareProofs.addProofs(data.sender, data.proofs);
    if (this.handState.privateCardShareProofs.receivedAllProofsFor(cardIndexes)) {
      this.decryptPublicCards(data.round, cardIndexes);
    }
  };

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

  public get numberOfPlayers() {
    return this.gameState.players.filter((p) => p.status !== PlayerStatus.sittingOut).length;
  }

  public get myPlayer() {
    const player = this.gameState.players.find((p) => p.id === this.playerId);
    if (!player) throw new Error("my player does not exist");
    return player;
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

  public getCardIndexForRound(round: PublicCardRounds) {
    const lastPrivateCardIndex = this.numberOfPlayers * 2;
    let cardIndexes: number[];
    switch (round) {
      case PublicCardRounds.FLOP:
        cardIndexes = [
          lastPrivateCardIndex + 1,
          lastPrivateCardIndex + 2,
          lastPrivateCardIndex + 3,
        ];
        break;
      case PublicCardRounds.TURN:
        cardIndexes = [lastPrivateCardIndex + 4];
        break;
      case PublicCardRounds.RIVER:
        cardIndexes = [lastPrivateCardIndex + 5];
        break;
    }
    return cardIndexes;
  }

  private gameStarted = (data: OnChainGameStartedData) => {
    for (const playerId of data.players) {
      const player = this.gameState.players.find((p) => p.id === playerId);
      if (!player) throw new Error("state mismatch: player must have existed");
      player.status = PlayerStatus.active;
    }

    this.handState = {
      pot: [0],
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
      elGamalPublicKey: new Uint8Array(data.elGamalPublicKey),
      status: PlayerStatus.sittingOut,
    };
    this.gameState?.players.push(newPlayer);

    // TODO: remove
    if (this.playerId === this.gameState?.players[0]?.id) {
      this.onChainDataSource.pieSocketTransport.publish("game-state", {
        receiver: data.address,
        state: this.gameState,
      });

      // call game start if there are enough people in the room people
      console.log("sadjf;laksdjf", this.tableInfo.minPlayers, this.gameState.players.length);
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

  private receivedPlayerBet = (data: OnChainPlayerPlacedBetData) => {
    const sender = this.gameState.players.find((p) => p.id === data.player);
    if (!sender) throw new Error("sender of bet does not exist in game players!!");
    if (data.bettingRound !== this.handState.bettingManager?.activeRound)
      throw new Error("state mismatch between received event and game state");

    const potBeforeBet = Array.from(this.handState.pot);
    this.handState.pot = this.handState.bettingManager.receivedBet(data.action, sender);
    this.emit(GameEventTypes.PLAYER_PLACED_BET, {
      bettingRound: data.bettingRound,
      player: sender,
      betAction: data.action,
      potBeforeBet,
      potAfterBet: Array.from(this.handState.pot),
      availableActions: this.handState.bettingManager.selfLegalActions,
      placedAction: this.handState.bettingManager.placedAction || null,
    });
    const nextPlayer = this.handState.bettingManager.nextBettingPlayer;
    const nextPublicCardRound = getNextPublicCardRound(data.bettingRound);
    if (nextPlayer === null && nextPublicCardRound !== null) {
      // TODO: betting round finished
      this.gameState.status === getGameStatusForPublicCard(nextPublicCardRound);
      this.createAndSharePublicKeyShares(nextPublicCardRound);
      this.handState.bettingManager.active = false;
      return;
    }
    if (nextPlayer === null) {
      //TODO: showdown
      return;
    }

    // don't send awaiting bet to ui for small and big blind
    if (data.action !== BettingActions.BIG_BLIND && data.action !== BettingActions.SMALL_BLIND) {
      this.emit(GameEventTypes.AWAITING_BET, {
        bettingRound: data.bettingRound,
        bettingPlayer: nextPlayer,
        pot: this.handState.pot,
        availableActions: this.handState.bettingManager.selfLegalActions,
        placedAction: this.handState.bettingManager.placedAction || null,
      });
    }
    // i am big blind no need to get the bet from ui I just send it
    if (data.action === BettingActions.SMALL_BLIND) {
      this.handState.bettingManager.sendOrKeepSelfBet(this.sendBet, BettingActions.BIG_BLIND);
    } else {
      this.handState.bettingManager.sendOrKeepSelfBet(this.sendBet);
    }
  };

  private async createAndSharePrivateKeyShares() {
    if (!this.elGamalSecretKey) throw new Error("elGamal secret key should be present");
    if (!this.zkDeck) throw new Error("zkDeck should be present");
    if (!this.handState.privateCardShareProofs)
      throw new Error("CardShareProofSource must already be present");

    const cardIndexes = Array.from(new Array(this.numberOfPlayers * 2).keys());

    const proofsAndShares = await this.createDecryptionShareProofsFor(cardIndexes);

    this.handState.privateCardShareProofs.addProofs(this.playerId, proofsAndShares);

    const myPrivateCardsIndexes = this.myPrivateCardIndexes;
    const proofsToSend = proofsAndShares.filter(
      (pas) => !myPrivateCardsIndexes.includes(pas.cardIndex),
    );
    this.onChainDataSource.privateCardsDecryptionShare(this.playerId, proofsToSend);
  }

  private async createDecryptionShareProofsFor(indexes: number[]) {
    if (!this.elGamalSecretKey) throw new Error("elGamal secret key should be present");
    if (!this.zkDeck) throw new Error("zkDeck should be present");
    if (!this.handState.finalOutDeck) {
      this.handState.finalOutDeck = await this.onChainDataSource.queryLastOutDeck(
        this.tableInfo.id,
      );
    }
    const proofPromises: Promise<{
      proof: Proof;
      decryptionCardShare: DecryptionCardShare;
    }>[] = [];
    for (const index of indexes) {
      proofPromises.push(
        this.zkDeck.proveDecryptCardShare(
          this.elGamalSecretKey,
          index,
          this.handState.finalOutDeck,
        ),
      );
    }
    const proofsAndShares = (await Promise.all(proofPromises)).map((s, i) =>
      Object.assign({ cardIndex: indexes[i] as number }, s),
    );
    return proofsAndShares;
  }

  private async createAndSharePublicKeyShares(round: PublicCardRounds) {
    if (!this.handState.privateCardShareProofs)
      throw new Error("CardShareProofSource must already be present");

    const cardIndexes = this.getCardIndexForRound(round);
    const proofsAndShares = await this.createDecryptionShareProofsFor(cardIndexes);
    this.handState.privateCardShareProofs.addProofs(this.playerId, proofsAndShares);
    this.onChainDataSource.publicCardsDecryptionShare(this.playerId, proofsAndShares, round);
  }

  private decryptCard(index: number) {
    if (!this.handState.privateCardShareProofs) throw new Error("invalid call");
    if (!this.handState.finalOutDeck) throw new Error("finalOutDeck must be present");
    if (!this.zkDeck) throw new Error("zkDeck must have been created by now!");
    const proofsAndSharesOfCard = this.handState.privateCardShareProofs.getProofsFor(index);
    return this.zkDeck.decryptCard(
      index,
      this.handState.finalOutDeck,
      proofsAndSharesOfCard.map((pas) => pas.decryptionCardShare),
    );
  }

  private decryptPublicCards(round: PublicCardRounds, indexes: number[]) {
    const publicCards = indexes.map((index) => this.decryptCard(index));
    this.emit(GameEventTypes.RECEIVED_PUBLIC_CARDS, {
      round,
      cards: publicCards,
    } as ReceivedPublicCardsEvent);
    this.initBettingRound(getNextBettingRound(round));
  }

  private decryptMyPrivateCards() {
    const [firstCardIndex, secondCardIndex] = this.myPrivateCardIndexes;
    const firstPrivateCard = this.decryptCard(firstCardIndex);
    const secondPrivateCard = this.decryptCard(secondCardIndex);

    this.emit(GameEventTypes.RECEIVED_PRIVATE_CARDS, {
      cards: [firstPrivateCard, secondPrivateCard],
    });
    this.initBettingRound(BettingRounds.PRE_FLOP);
  }

  private initBettingRound(round: BettingRounds) {
    console.log("init betting round", round);
    this.gameState.status = getGameStatus(round);
    if (round === BettingRounds.PRE_FLOP) {
      this.handState.bettingManager = new BettingManager(
        this.gameState.players,
        this.gameState.players[this.gameState.dealer] as Player,
        this.tableInfo,
        this.myPlayer,
      );
    }
    if (!this.handState.bettingManager) throw new Error("illegal call of rounds");
    this.handState.bettingManager.startRound(round);

    const nextBettingPlayer = this.handState.bettingManager.nextBettingPlayer;
    const nextPublicCardRound = getNextPublicCardRound(round);
    if (nextBettingPlayer === null && nextPublicCardRound !== null) {
      this.createAndSharePublicKeyShares(nextPublicCardRound);
      return;
    }
    if (nextBettingPlayer === null) {
      //TODO: showdown
      return;
    }
    const isItMyTurn = nextBettingPlayer === this.myPlayer;
    // don't send event for small blind
    if (round !== BettingRounds.PRE_FLOP) {
      this.emit(GameEventTypes.AWAITING_BET, {
        bettingRound: round,
        bettingPlayer: nextBettingPlayer,
        pot: this.handState.pot,
        availableActions: this.handState.bettingManager.selfLegalActions,
        placedAction: this.handState.bettingManager.placedAction || null,
      });
    }
    if (!isItMyTurn) return;

    // then I'm small blind
    if (round === BettingRounds.PRE_FLOP) {
      this.sendBet(BettingActions.SMALL_BLIND);
      return;
    }
    this.handState.bettingManager.sendOrKeepSelfBet(this.sendBet);
  }

  private sendBet = (action: BettingActions) => {
    if (!this.handState.bettingManager?.activeRound)
      throw new Error("bet called outside of betting round");
    this.onChainDataSource.bet(this.handState.bettingManager.activeRound, action);
  };

  public placeBet(action: PlacingBettingActions) {
    if (!this.handState.bettingManager?.active) throw new Error("Not in betting round");
    if (this.myPlayer.status !== PlayerStatus.active)
      throw new Error(
        "You are not an active player (either folded or all in) therefore cannot place a bet",
      );
    this.handState.bettingManager.sendOrKeepSelfBet(this.sendBet, action);
  }

  private async shuffle() {
    if (!this.zkDeck) throw new Error("zkDeck must have been created by now!");
    const publicKeys = this.gameState.players.map((p) => p.elGamalPublicKey);
    const aggregatedPublicKey = this.zkDeck.generateAggregatedPublicKey(publicKeys);
    this.handState.aggregatedPublicKey = aggregatedPublicKey;
    const inputDeck = this.amIDealer()
      ? this.zkDeck.initialEncryptedDeck
      : await this.onChainDataSource.queryLastOutDeck(this.tableInfo.id);
    const { proof, outputDeck } = await this.zkDeck.proveShuffleEncryptDeck(
      aggregatedPublicKey,
      inputDeck,
    );
    this.onChainDataSource.shuffledDeck(this.playerId, proof, outputDeck);
  }

  public async checkIn(buyIn: number): Promise<GameState> {
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
