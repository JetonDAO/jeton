// @ts-nocheck
// biome-ignore : <explanation>
import { EventEmitter } from "events";

import type {
  InputTransactionData,
  SignMessagePayload,
  SignMessageResponse,
} from "@aptos-labs/wallet-adapter-core";

import {
  type DecryptionCardShare,
  type PublicKey as ElGamalPublicKey,
  type EncryptedDeck,
  type Groth16Proof,
  type ZKDeck,
  createZKDeck,
} from "@jeton/zk-deck";

import { getUrlBytes, readData } from "./utils/getURLBytes";

import {
  BettingRounds,
  GameStatus,
  PlacingBettingActions,
  type Player,
  PlayerStatus,
  type TableInfo,
} from "./types";

import { getGameStatus } from ".";
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

export class PollingGame extends EventEmitter<GameEventMap> {
  private onChainDataSource: PollingDataSource;

  private tableInfo: TableInfo;
  private playerId: string;
  private signMessage: (message: SignMessagePayload) => Promise<SignMessageResponse>;
  private signAndSubmitTransaction: (transaction: InputTransactionData) => Promise<void>;
  // TODO: definitely assigned problem
  private zkDeck?: ZKDeck;
  private elGamalPublicKey?: ElGamalPublicKey;
  private elGamalSecretKey?: bigint;
  private mySeatIndex?: number;
  private myPrivateCardsShares?: [DecryptionCardShare, DecryptionCardShare];

  private creatingZKDeck: Promise<void>;

  private previousGameState?: WholeGameState;
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
    for (const player of Object.values(state.seats)) {
      if (player && player.id === this.playerId) return true;
    }
    return false;
  }

  private async shuffle() {
    const state = this.gameState;
    if (!this.zkDeck) throw new Error("zkDeck must have been created by now!");
    if (!state || !state.deck) throw new Error("game state must be present");
    const aggregatedPublicKey = state.aggregatedPublicKey;
    const { proof, outputDeck } = await this.zkDeck.proveShuffleEncryptDeck(
      aggregatedPublicKey,
      state.deck,
    );
    this.onChainDataSource.shuffledDeck(proof, outputDeck);
  }

  public getPlayer(seatIndex: number) {
    const state = this.gameState;
    if (!state) throw new Error("game state must be present");
    return state.seats[seatIndex];
  }

  public get numberOfPlayers() {
    const state = this.gameState;
    if (!state) throw new Error("game state must be present");
    return Object.values(state.seats || {}).filter((p) => p && p.status !== PlayerStatus.sittingOut)
      .length;
  }

  public get numSeats() {
    return this.tableInfo.maxPlayers;
  }
  public get amISittingOut() {
    const state = this.gameState;
    if (!state) throw new Error("game state must be present");
    const myPlayer = state.seats[this.mySeatIndex!];
    if (!myPlayer) return true;
    return myPlayer.status === PlayerStatus.sittingOut;
  }

  private get myDistanceFromDealer() {
    const state = this.gameState;
    if (!state) throw new Error("game state must be present");
    if (state.seats[this.mySeatIndex!]?.status === PlayerStatus.sittingOut)
      throw new Error("distance doesn't have meaning for sitting out players");
    const numberOfSeats = this.tableInfo.maxPlayers;
    const dealerIndex = state.dealerIndex;
    let nextPlayerIndex = dealerIndex;
    let distance = 0;
    while (this.mySeatIndex !== nextPlayerIndex) {
      nextPlayerIndex = (nextPlayerIndex + 1) % numberOfSeats;
      if (state.seats[nextPlayerIndex]?.status !== PlayerStatus.sittingOut) {
        distance += 1;
      }
    }
    return distance;
  }

  private get myPrivateCardIndexes() {
    const state = this.gameState;
    if (!state) throw new Error("game state must be present");
    return [this.myDistanceFromDealer * 2, this.myDistanceFromDealer * 2 + 1] as const;
  }

  private get players() {
    if (!this.gameState) throw new Error("game state must exist");
    return Object.values(this.gameState?.seats).filter(
      (p) => p && p.status !== PlayerStatus.sittingOut,
    ) as Player[];
  }

  private differentPlayers() {
    const state = this.gameState;
    const previousState = this.previousGameState;
    if (!state || !previousState) throw new Error("game state must be present");
    const addedDiff: Player[] = [];
    const removedDiff: Player[] = [];
    for (const [seatIndex, player] of Object.entries(state.seats)) {
      const prevPlayer = state.seats[seatIndex];
      if (!prevPlayer && player) {
        addedDiff.push(player);
      } else if (prevPlayer && player && prevPlayer.id !== player.id) {
        addedDiff.push(player);
        removedDiff.push(prevPlayer);
      } else if (prevPlayer && player == null) {
        removedDiff.push(prevPlayer);
      }
    }
    return [addedDiff, removedDiff] as const;
  }

  private async createAndSharePrivateKeyShares(state: WholeGameState) {
    if (!this.elGamalSecretKey) throw new Error("elGamal secret key should be present");
    if (!this.zkDeck) throw new Error("zkDeck should be present");

    const cardIndexes = Array.from(new Array(this.numberOfPlayers * 2).keys());

    const proofsAndShares = await this.createDecryptionShareProofsFor(cardIndexes, state);

    const myPrivateCardsIndexes = this.myPrivateCardIndexes;
    const proofsToSend = proofsAndShares.filter(
      (pas) => !myPrivateCardsIndexes.includes(pas.cardIndex),
    );
    this.myPrivateCardsShares = proofsAndShares
      .filter((pas) => myPrivateCardsIndexes.includes(pas.cardIndex))
      .map((pas) => pas.decryptionCardShare) as [DecryptionCardShare, DecryptionCardShare];
    this.onChainDataSource.privateCardsDecryptionShare(proofsToSend);
  }

  private async createDecryptionShareProofsFor(indexes: number[], state: WholeGameState) {
    if (!this.elGamalSecretKey) throw new Error("elGamal secret key should be present");
    if (!this.zkDeck) throw new Error("zkDeck should be present");
    if (!state.deck) throw new Error("State has no deck");

    const proofPromises: Promise<{
      proof: Groth16Proof;
      decryptionCardShare: DecryptionCardShare;
    }>[] = [];
    for (const index of indexes) {
      proofPromises.push(
        this.zkDeck.proveDecryptCardShare(this.elGamalSecretKey, index, state.deck),
      );
    }
    const proofsAndShares = (await Promise.all(proofPromises)).map((s, i) =>
      Object.assign({ cardIndex: indexes[i] as number }, s),
    );
    return proofsAndShares;
  }

  private receivedAllPrivateShares(state: WholeGameState): boolean {
    const contributorsIndex = state.statusValue[GameStatus.DrawPrivateCards];
    if (!Array.isArray(contributorsIndex)) {
      throw new Error("this should not happen");
    }
    for (const [index, player] of Object.entries(state.seats)) {
      if (player && player.status !== PlayerStatus.sittingOut && !contributorsIndex.includes(index))
        return false;
    }
    return true;
  }

  private async decryptMyPrivateCards(state: WholeGameState) {
    if (!this.zkDeck) throw new Error("zkDeck must have been created by now!");
    if (!state.deck) throw new Error("no Deck available");
    if (!this.myPrivateCardsShares) throw new Error("must be available");
    const [firstCardIndex, secondCardIndex] = this.myPrivateCardIndexes;
    const firstCardShares = [
      state.privateCardsShares[firstCardIndex] as DecryptionCardShare,
      this.myPrivateCardsShares[0],
    ];
    const secondCardShares = [
      state.privateCardsShares[secondCardIndex] as DecryptionCardShare,
      this.myPrivateCardsShares[1],
    ];
    const firstPrivateCard = this.zkDeck.decryptCard(firstCardIndex, state.deck, firstCardShares);
    const secondPrivateCard = this.zkDeck.decryptCard(
      secondCardIndex,
      state.deck,
      secondCardShares,
    );

    this.emit(GameEventTypes.RECEIVED_PRIVATE_CARDS, {
      cards: [firstPrivateCard, secondPrivateCard],
    });
  }

  private receivedGameState = (newState: WholeGameState) => {
    this.previousGameState = this.gameState;
    this.gameState = newState;
    if (!this.gameState || !this.previousGameState) throw new Error("Game state must be present");
    // TODO: player events?!!
    if (newState.gameStatus === GameStatus.AwaitingStart) {
      console.log("awaiting start");
    } else if (
      newState.gameStatus === GameStatus.Shuffle &&
      newState.statusValue[GameStatus.Shuffle].seatIndex! !==
        this.previousGameState?.statusValue[GameStatus.Shuffle].seatIndex!
    ) {
      const shufflingSeatIndex = newState.statusValue[GameStatus.Shuffle].seatIndex!;
      this.emit(GameEventTypes.PLAYER_SHUFFLING, this.getPlayer(shufflingSeatIndex) as Player);
      if (shufflingSeatIndex === this.mySeatIndex && !this.amISittingOut) {
        this.shuffle();
      }
    }
    // TODO: same event for removed players
    const [addedPlayers, removedPlayers] = this.differentPlayers();
    for (const player of addedPlayers) {
      this.emit(GameEventTypes.NEW_PLAYER_CHECK_IN, player);
    }
    if (
      this.previousGameState.gameStatus === GameStatus.Shuffle &&
      newState.gameStatus === GameStatus.DrawPrivateCards
    ) {
      this.emit(GameEventTypes.PRIVATE_CARD_DECRYPTION_STARTED, {});
      if (!this.amISittingOut) this.createAndSharePrivateKeyShares(newState);
    }
    if (this.receivedAllPrivateShares(newState) && !this.amISittingOut) {
      this.decryptMyPrivateCards(newState);
    }
    if (newState.gameStatus === GameStatus.BetPreFlop) {
      this.getBetEvents(BettingRounds.PRE_FLOP);
    }
  };

  private getBetEvents(round: BettingRounds) {
    if (!this.previousGameState || !this.gameState) throw new Error("empty state");
    let seatToBet: number;
    const awaitingForSeat = this.gameState.statusValue[getGameStatus(round)].seatIndex;
    if (this.previousGameState?.gameStatus !== getGameStatus(round)) {
      //TODO: maybe this is wrong for edge cases?
      seatToBet = this.nextBettingPlayerSeat(round, round === BettingRounds.PRE_FLOP ? 2 : 0);
    } else {
      seatToBet = this.previousGameState.statusValue[this.previousGameState.gameStatus].seatIndex;
    }
    while (seatToBet !== awaitingForSeat) {
      this.emit(GameEventTypes.PLAYER_PLACED_BET, {
        bettingRound: round,
        player: this.gameState.seats[seatToBet] as Player,
        betAction: data.action,
        potBeforeBet,
        potAfterBet: Array.from(this.handState.pot),
        availableActions: this.getPlayerAvailableActions(),
      });
    }
    this.emit(GameEventTypes.AWAITING_BET, {
      bettingRound: round,
      bettingPlayer: this.gameState.seats[awaitingForSeat] as Player,
      pot: this.reconstructPot(),
      availableActions: this.getPlayerAvailableActions(),
    });
  }

  private nextBettingPlayerSeat(round: BettingRounds, offSet = 0) {
    if (!this.gameState) throw new Error("must exist");
    let offSetReached = offSet;
    const currentPlayerSeat = this.gameState.dealerIndex;
    let nextPlayerSeat = (currentPlayerSeat + 1) % this.numSeats;
    let nextPlayer = this.gameState.seats[nextPlayerSeat] as Player;
    while (nextPlayer.status !== PlayerStatus.active || offSetReached !== 0) {
      if (nextPlayer.status === PlayerStatus.active) {
        offSetReached -= 1;
      }
      nextPlayerSeat = (nextPlayerSeat + 1) % this.numSeats;
      nextPlayer = this.players[nextPlayerSeat] as Player;
    }
    return nextPlayerSeat;
  }

  public get selfLegalActions(): PlacingBettingActions[] {
    if (!this.mySeatIndex) throw new Error("should exist");
    const self = this.getPlayer(this.mySeatIndex);
    if (!self) return [];
    if (self.status === PlayerStatus.folded || self.status === PlayerStatus.sittingOut) return [];
    const actions = [PlacingBettingActions.FOLD, PlacingBettingActions.CHECK_CALL];
    if (self.status === PlayerStatus.allIn) return actions;
    const alreadyBettedAmount = self.bet;
    if (alreadyBettedAmount == null) throw new Error("should not be undefined");
    const expectedAmount =
      (this.numberOfRaisesInRound + 1) * this.raiseAmount - alreadyBettedAmount;
    if (
      this.numberOfRaisesInRound < this.tableInfo.numberOfRaises &&
      expectedAmount < this.selfBettingState.self.balance
    ) {
      actions.push(PlacingBettingActions.RAISE);
    }
    return actions;
  }

  private reconstructPot() {
    if (!this.gameState) throw new Error("game state must exist");
    const copiedBets: Record<string, number> = {};
    for (const player of this.players) {
      copiedBets[player.id] = player.bet;
    }
    const allInPlayers = this.players
      .filter((p) => p.status === PlayerStatus.allIn)
      .sort((p1, p2) => (copiedBets[p1.id] as number) - (copiedBets[p2.id] as number));

    const newPot: number[] = [];
    for (const allInPlayer of allInPlayers) {
      if (copiedBets[allInPlayer.id] === 0) continue;
      let sidePot = 0;
      const allInBet = copiedBets[allInPlayer.id] as number;
      for (const [id, bet] of Object.entries(copiedBets)) {
        if (bet > 0 && bet < allInBet) {
          sidePot += bet;
          copiedBets[id] = 0;
        } else if (bet > 0) {
          sidePot += allInBet;
          copiedBets[id]! -= allInBet;
        }
      }
      newPot.push(sidePot);
    }

    let finalPot = 0;
    for (const bet of Object.values(copiedBets)) {
      finalPot += bet;
    }
    if (finalPot !== 0) newPot.push(finalPot);

    return newPot;
  }

  private setMySeatIndex() {
    if (!this.gameState) throw new Error("No game state");
    for (const [seat, player] of Object.entries(this.gameState.seats)) {
      if (player && player.id === this.playerId) {
        this.mySeatIndex = Number(seat);
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
    this.receivedGameState(this.gameState);
    return {
      players: Object.values(this.gameState.seats),
      dealer: this.gameState.dealerIndex,
      status: this.gameState.gameStatus,
    };
  }
}
