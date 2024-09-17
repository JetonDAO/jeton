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
  BettingActions,
  BettingRounds,
  type GameState,
  GameStatus,
  type HandState,
  PlacingBettingActions,
  type Player,
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
  type OnChainPlayerPlacedBetData,
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
    this.handState = { pot: [], foldedPlayers: [], allIns: [] };
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
    this.onChainDataSource.on(OnChainEventTypes.PLAYER_PLACED_BET, this.receivedPlayerBet);
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

  private getNextBettingPlayer(currentPlayerId: string, action: BettingActions) {
    if (!this.handState.bettingRound)
      throw new Error("getNextBettingPlayer called outside of betting round");
    const numberOfPlayers = this.gameState.players.length;
    const playerIndex = this.gameState.players.findIndex((p) => p.id === currentPlayerId);

    let nextPlayerIndex = (playerIndex + 1) % numberOfPlayers;
    if (playerIndex === -1) throw new Error("could not find requested player");
    let nextPlayer = this.gameState.players[nextPlayerIndex];
    if (!nextPlayer) throw new Error("array out of bound");

    if (action === BettingActions.SMALL_BLIND || action === BettingActions.BIG_BLIND) {
      return nextPlayer;
    }

    const afterLastToBet = this.handState.bettingRound.afterLastToBet;
    while (!this.isActive(nextPlayer)) {
      nextPlayerIndex = (nextPlayerIndex + 1) % numberOfPlayers;
      nextPlayer = this.gameState.players[nextPlayerIndex];
      if (!nextPlayer) throw new Error("array out of bound");
      if (nextPlayer === afterLastToBet) return null;
    }
    if (nextPlayer === afterLastToBet) return null;
    return nextPlayer;
  }

  public didFold(player: Player) {
    return this.handState.foldedPlayers.includes(player);
  }

  public isAllIn(player: Player) {
    return this.handState.allIns.includes(player);
  }

  public isActive(player: Player) {
    return !this.didFold(player) && !this.isAllIn(player);
  }

  private amIDealer() {
    return this.playerId === this.gameState.players[this.gameState.dealer]?.id;
  }

  public get numberOfPlayers() {
    return this.gameState.players.length;
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

  private gameStarted = (data: OnChainGameStartedData) => {
    this.handState = {
      pot: [0],
      foldedPlayers: [],
      privateCardShareProofs: new CardShareProofSource(this.gameState.players),
      allIns: [],
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

  private get raiseAmount() {
    if (!this.handState.bettingRound) throw new Error("betting round is not defined");
    return [BettingRounds.PRE_FLOP, BettingRounds.FLOP].includes(this.handState.bettingRound.round)
      ? this.tableInfo.smallBlind * 2
      : this.tableInfo.smallBlind * 4;
  }

  private receivedPlayerBet = (data: OnChainPlayerPlacedBetData) => {
    const sender = this.gameState.players.find((p) => p.id === data.player);
    if (!sender) throw new Error("sender of bet does not exist in game players!!");
    if (data.bettingRound !== this.handState.bettingRound?.round)
      throw new Error("state mismatch between received event and game state");

    // TODO: check validity of action
    const potBeforeBet = Array.from(this.handState.pot);
    this.calculateNewBettingState(data.action, sender);
    this.emit(GameEventTypes.PLAYER_PLACED_BET, {
      player: sender,
      betAction: data.action,
      potBeforeBet,
      potAfterBet: Array.from(this.handState.pot),
    });
    const nextPlayer = this.getNextBettingPlayer(sender.id, data.action);
    if (!nextPlayer) {
      // TODO: betting round finished
      console.log("betting round finished");
      return;
    }

    // don't send awaiting bet to ui for small and big blind
    if (data.action !== BettingActions.BIG_BLIND && data.action !== BettingActions.SMALL_BLIND) {
      this.emit(GameEventTypes.AWAITING_BET, {
        bettingRound: data.bettingRound,
        bettingPlayer: nextPlayer,
        pot: this.handState.pot,
      });
    }
    // i am big blind no need to get the bet from ui I just send it
    if (nextPlayer.id === this.playerId && data.action === BettingActions.SMALL_BLIND) {
      this.sendBet(BettingActions.BIG_BLIND);
    } else if (
      nextPlayer.id === this.playerId &&
      this.handState.bettingRound.selfPlayerBettingState.preemptivelyPlacedBet
    ) {
      const actualAction = this.convertBet(
        this.handState.bettingRound.selfPlayerBettingState.preemptivelyPlacedBet,
      );
      this.handState.bettingRound.selfPlayerBettingState.preemptivelyPlacedBet = null;
      this.handState.bettingRound.selfPlayerBettingState.alreadySentForRound = true;
      this.sendBet(actualAction);
    } else if (nextPlayer.id === this.playerId) {
      this.handState.bettingRound.selfPlayerBettingState.awaitingBetPlacement = true;
    }
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
    this.emit(GameEventTypes.RECEIVED_PRIVATE_CARDS, {
      cards: [firstPrivateCard, secondPrivateCard],
    });
    this.initBettingRound(BettingRounds.PRE_FLOP);
  }

  private initBettingRound(round: BettingRounds) {
    // TODO: active Players
    // edge case: small blind or big blind don't have enough money
    // so is sitting out

    const lastToBetIndex =
      (round === BettingRounds.PRE_FLOP ? this.gameState.dealer + 3 : this.gameState.dealer + 1) %
      this.gameState.players.length;

    this.handState.bettingRound = {
      active: true,
      round,
      bets: this.gameState.players.reduce<Record<string, number>>((bets, player) => {
        bets[player.id] = 0;
        return bets;
      }, {}),
      afterLastToBet: this.gameState.players[lastToBetIndex] as Player,
      numberOfRaises: 0,
      selfPlayerBettingState: {
        alreadySentForRound: false,
        awaitingBetPlacement: false,
      },
    };
    const isItMyTurn = this.myDistanceFromDealer === 1;
    if (!isItMyTurn) return;

    // then I'm small blind
    if (round === BettingRounds.PRE_FLOP) {
      this.sendBet(BettingActions.SMALL_BLIND);
    }
    // TODO:
  }

  private sendBet(action: BettingActions) {
    if (!this.handState.bettingRound) throw new Error("bet called outside of betting round");
    this.onChainDataSource.bet(this.handState.bettingRound.round, action);
  }

  public placeBet(action: PlacingBettingActions) {
    if (!this.handState.bettingRound) throw new Error("Not in betting round");
    if (!this.isActive(this.myPlayer))
      throw new Error(
        "You are not an active player (either folded or all in) therefore cannot place a bet",
      );
    if (this.handState.bettingRound?.selfPlayerBettingState.alreadySentForRound)
      throw new Error("already set bet can't bet now");
    if (this.handState.bettingRound?.selfPlayerBettingState.awaitingBetPlacement) {
      this.handState.bettingRound.selfPlayerBettingState.preemptivelyPlacedBet = null;
      this.handState.bettingRound.selfPlayerBettingState.alreadySentForRound = true;
      this.sendBet(this.convertBet(action));
    } else {
      this.handState.bettingRound.selfPlayerBettingState.preemptivelyPlacedBet = action;
    }
  }

  private convertBet(action: PlacingBettingActions): BettingActions {
    if (!this.handState.bettingRound) throw new Error("called outside of betting round");
    const alreadyBettedAmount = this.handState.bettingRound.bets[this.playerId];
    if (!alreadyBettedAmount) throw new Error("should not be undefined");
    switch (action) {
      case PlacingBettingActions.FOLD:
        return BettingActions.FOLD;
      // biome-ignore lint/suspicious/noFallthroughSwitchClause: <explanation>
      case PlacingBettingActions.RAISE: {
        const expectedAmount =
          (this.handState.bettingRound.numberOfRaises + 1) * this.raiseAmount - alreadyBettedAmount;
        if (
          this.handState.bettingRound.numberOfRaises < this.tableInfo.numberOfRaises &&
          expectedAmount < this.myPlayer.balance
        ) {
          return BettingActions.RAISE;
        }
      }
      case PlacingBettingActions.CHECK_CALL: {
        if (!alreadyBettedAmount) throw new Error("should not be undefined");
        const expectedAmount =
          this.handState.bettingRound.numberOfRaises * this.raiseAmount - alreadyBettedAmount;
        if (expectedAmount === 0) return BettingActions.CHECK;
        if (expectedAmount > this.myPlayer.balance) return BettingActions.ALL_IN;
        return BettingActions.CALL;
      }
    }
  }

  private calculateNewBettingState(action: BettingActions, sender: Player) {
    if (!this.handState.bettingRound) throw new Error("must be present");
    switch (action) {
      case BettingActions.FOLD:
        this.handState.foldedPlayers.push(sender);
        break;
      case BettingActions.SMALL_BLIND: {
        const amount = this.tableInfo.smallBlind * 2;
        this.handState.bettingRound.bets[sender.id] += amount;
        sender.balance -= amount;
        this.handState.pot = this.reconstructPot();
        break;
      }
      case BettingActions.BIG_BLIND: {
        const amount = this.tableInfo.smallBlind * 2;
        this.handState.bettingRound.numberOfRaises += 1;
        this.handState.bettingRound.bets[sender.id] += amount;
        sender.balance -= amount;
        this.handState.pot = this.reconstructPot();
        break;
      }
      case BettingActions.CHECK:
        break;
      // biome-ignore lint/suspicious/noFallthroughSwitchClause: <explanation>
      case BettingActions.RAISE:
        this.handState.bettingRound.numberOfRaises += 1;
        this.handState.bettingRound.afterLastToBet = sender;
      case BettingActions.CALL: {
        const totalRaisedAmount = this.handState.bettingRound.numberOfRaises * this.raiseAmount;
        const amountNeededToCall =
          totalRaisedAmount - (this.handState.bettingRound.bets[sender.id] as number);

        this.handState.bettingRound.bets[sender.id] += amountNeededToCall;
        sender.balance -= amountNeededToCall;
        this.handState.pot = this.reconstructPot();
        break;
      }
      case BettingActions.ALL_IN: {
        this.handState.bettingRound.bets[sender.id] += sender.balance;
        sender.balance = 0;
        this.handState.allIns.push(sender);
        this.handState.pot = this.reconstructPot();
        break;
      }
      default:
        throw new Error("Unreachable Code");
    }
    if (sender.balance < 0) throw new Error("player balance should not be less than 0");
  }

  private reconstructPot() {
    const bets = this.handState.bettingRound?.bets;
    if (!bets) throw new Error("bets should not be undefined");
    const copiedBets = Object.assign({}, bets);
    const allInPlayers = this.handState.allIns.sort(
      (p1, p2) => (bets[p1.id] as number) - (bets[p2.id] as number),
    );

    const newPot = [];
    for (const allInPlayer of allInPlayers) {
      if (copiedBets[allInPlayer.id] === 0) continue;
      let sidePot = 0;
      for (const [id, bet] of Object.entries(copiedBets)) {
        if (bet > 0 && bet < (bets[allInPlayer.id] as number)) {
          sidePot += bet;
          copiedBets[id] = 0;
        } else if (bet > 0) {
          sidePot += bets[allInPlayer.id] as number;
          copiedBets[id] -= bets[allInPlayer.id] as number;
        }
      }
      newPot.push(sidePot);
    }
    let finalPot = 0;
    for (const bet of Object.values(copiedBets)) {
      finalPot += bet;
    }
    newPot.push(finalPot);

    return newPot;
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
