import { EventEmitter } from "events";
import type { DecryptionCardShare, Proof, ZKDeck } from "@jeton/zk-deck";
import {
  type OnChainCardsSharesData,
  type OnChainDataSourceInstance,
  OnChainEventTypes,
  type OnChainPlayerCheckedInData,
  type OnChainPlayerPlacedBetData,
  type OnChainShowDownData,
  type OnChainShuffledDeckData,
  type OnChainTableObject,
} from "@src/OnChainDataSource";
import { AptosOnChainDataSource } from "@src/OnChainDataSource/AptosOnChainDataSource";
import onChainDataMapper, { covertTableInfo } from "@src/OnChainDataSource/onChainDataMapper";
import {
  BettingActions,
  BettingRounds,
  type CardShareAndProof,
  type ChipUnits,
  type GameEventMap,
  GameEventTypes,
  GameStatus,
  PlacingBettingActions,
  type Player,
  PlayerStatus,
  type PublicCardRounds,
  type ReceivedPublicCardsEvent,
  type ShowDownEvent,
  type TableInfo,
} from "@src/types";
import { type PendingMemo, createPendingMemo } from "@src/utils/PendingMemo";
import { type ZkDeckUrls, createLocalZKDeck } from "@src/utils/createZKDeck";
import { hexStringToUint8Array } from "@src/utils/unsignedInt";
import { getBettingRound, getPreviousPublicCardRound, getPublicCardRound } from "..";
import {
  getBettingPlayer,
  getBigBlindPlayer,
  getCardIndexes,
  getCardShares,
  getDeck,
  getNumberOfRaisesLeft,
  getPlayerByAddress,
  getPot,
  getPrivateCardsIndexes,
  getShufflingPlayer,
  getSmallBlindPlayer,
  isActivePlayer,
} from "./helpers";

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
  private myPrivateCardsShares?: [CardShareAndProof, CardShareAndProof];
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
    this.onChainDataSource.on(OnChainEventTypes.CARDS_SHARES_RECEIVED, this.receivedCardsShares);
    this.onChainDataSource.on(OnChainEventTypes.PLAYER_PLACED_BET, this.receivedPlayerBet);
    this.onChainDataSource.on(OnChainEventTypes.SHOW_DOWN, this.receivedShowDown);
    this.onChainDataSource.listenToTableEvents(this.tableInfo.id);
  }

  private receivedShowDown = async (data: OnChainShowDownData) => {
    if (!this.gameState) throw new Error(" must exist");
    const players = this.gameState.players;
    const eventData: ShowDownEvent = {};
    const privateCards = hexStringToUint8Array(data.privateCards);
    const publicCards = hexStringToUint8Array(data.privateCards);
    console.log("show down results", privateCards, publicCards, data.winningAmounts);
    for (const [index, player] of players.entries()) {
      eventData[player.id] = {
        player,
        winAmount: data.winningAmounts[index]!,
        cards: [privateCards[index * 2]!, privateCards[index * 2 + 1]!],
      };
    }
    this.emit(GameEventTypes.SHOW_DOWN, eventData);

    const onChainTableObject = await this.pendingMemo.memoize(this.queryGameState);
    this.gameState = onChainDataMapper.convertJetonState(onChainTableObject);
    // TODO: timeout is not a good solution
    setTimeout(() => {
      this.gameStarted(onChainTableObject);
    }, 3000);
  };

  private receivedPlayerBet = async (data: OnChainPlayerPlacedBetData) => {
    console.log("received Player bet", data);
    const onChainTableObject = await this.pendingMemo.memoize(this.queryGameState);
    const newState = onChainDataMapper.convertJetonState(onChainTableObject);
    const bettingRound = getBettingRound(newState.status);
    let sender: Player;
    if (data.action === BettingActions.SMALL_BLIND) {
      sender = onChainDataMapper.convertPlayer(getSmallBlindPlayer(onChainTableObject));
    } else if (data.action === BettingActions.BIG_BLIND) {
      sender = onChainDataMapper.convertPlayer(getBigBlindPlayer(onChainTableObject));
    } else {
      sender = onChainDataMapper.convertPlayer(
        getPlayerByAddress(onChainTableObject, data.address!)!,
      );
    }

    const pot = getPot(onChainTableObject);
    this.emit(GameEventTypes.PLAYER_PLACED_BET, {
      bettingRound,
      player: sender,
      betAction: data.action,
      potAfterBet: pot,
      availableActions: this.calculateAvailableActions(onChainTableObject),
    });

    const nextPlayer = getBettingPlayer(onChainTableObject);
    console.log("next player is", nextPlayer);

    if (
      nextPlayer === null &&
      [GameStatus.DrawFlop, GameStatus.DrawRiver, GameStatus.DrawTurn].includes(newState.status)
    ) {
      console.log("betting round finished, sharing keys for:", newState.status);
      this.createAndSharePublicKeyShares(onChainTableObject, getPublicCardRound(newState.status));
      return;
    }
    if (nextPlayer === null) {
      this.createAndShareSelfPrivateKeyShares(onChainTableObject);
      return;
    }
    // don't send awaiting bet to ui for small and big blind
    if (data.action !== BettingActions.SMALL_BLIND && nextPlayer) {
      this.publishAwaitingBet(onChainTableObject);
    }
    this.gameState = newState;
  };

  private publishAwaitingBet(tableObject: OnChainTableObject) {
    const newState = onChainDataMapper.convertJetonState(tableObject);
    const bettingRound = getBettingRound(newState.status);
    const nextPlayer = getBettingPlayer(tableObject);
    const pot = getPot(tableObject);
    if (!nextPlayer) throw new Error("not awaiting bet");
    this.emit(GameEventTypes.AWAITING_BET, {
      bettingRound: bettingRound,
      bettingPlayer: onChainDataMapper.convertPlayer(nextPlayer),
      pot,
      availableActions: this.calculateAvailableActions(tableObject),
    });
  }

  private receivedCardsShares = async (data: OnChainCardsSharesData) => {
    const onChainTableObject = await this.pendingMemo.memoize(this.queryGameState);
    const newState = onChainDataMapper.convertJetonState(onChainTableObject);

    const publicCardRound = getPreviousPublicCardRound(newState.status);

    if (newState.status === GameStatus.BetPreFlop) {
      this.decryptMyPrivateCards(onChainTableObject);
    } else if (publicCardRound != null) {
      this.decryptPublicCards(onChainTableObject, publicCardRound);
      this.publishAwaitingBet(onChainTableObject);
    }

    this.gameState = newState;
  };

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
      this.gameStarted(onChainTableObject);
    }

    this.gameState = newJState;
  };

  private gameStarted(state: OnChainTableObject) {
    const newJState = onChainDataMapper.convertJetonState(state);
    const dealerIndex = newJState.dealerIndex;
    this.emit(GameEventTypes.HAND_STARTED, { dealer: newJState.players[dealerIndex]! });
    const shufflingPlayer = getShufflingPlayer(state);
    if (shufflingPlayer)
      this.emit(GameEventTypes.PLAYER_SHUFFLING, onChainDataMapper.convertPlayer(shufflingPlayer));
    this.checkForActions(state);
  }

  private playerShuffledDeck = async (data: OnChainShuffledDeckData) => {
    console.log("player shuffled deck");
    const onChainTableObject = await this.pendingMemo.memoize(this.queryGameState);
    const shufflingPlayer = getShufflingPlayer(onChainTableObject);
    if (!shufflingPlayer) {
      console.log("shuffle ended, lets do private card decryption");
      this.emit(GameEventTypes.PRIVATE_CARD_DECRYPTION_STARTED, {});
      this.createAndSharePrivateKeyShares(onChainTableObject);
      this.gameState = onChainDataMapper.convertJetonState(onChainTableObject);
      return;
    }
    this.emit(GameEventTypes.PLAYER_SHUFFLING, onChainDataMapper.convertPlayer(shufflingPlayer));
    this.checkForActions(onChainTableObject);
    this.gameState = onChainDataMapper.convertJetonState(onChainTableObject);
  };

  private async createAndSharePublicKeyShares(
    tableObject: OnChainTableObject,
    round: PublicCardRounds,
  ) {
    const cardIndexes = getCardIndexes(tableObject, round);
    const proofsAndShares = await this.createDecryptionShareProofsFor(cardIndexes, tableObject);
    proofsAndShares.sort((a, b) => a.cardIndex - b.cardIndex);
    const proofsToSend = proofsAndShares.map((pas) => pas.proof);
    const sharesToSend = proofsAndShares.map((pas) => pas.decryptionCardShare);
    this.onChainDataSource.cardsDecryptionShares(this.tableInfo.id, sharesToSend, proofsToSend);
  }

  private async createAndSharePrivateKeyShares(state: OnChainTableObject) {
    console.log("create and share private key shares");
    if (!this.zkDeck) throw new Error("zkDeck should be present");
    // TODO: do not call if your player is not active player

    const numberOfPlayers = state.roster.players.length;
    const cardIndexes = Array.from(new Array(numberOfPlayers * 2).keys());

    const proofsAndShares = await this.createDecryptionShareProofsFor(cardIndexes, state);

    const myPrivateCardsIndexes = getPrivateCardsIndexes(state, this.playerId);
    const filteredPAS = proofsAndShares.filter(
      (pas) => !myPrivateCardsIndexes.includes(pas.cardIndex),
    );
    const proofsToSend = filteredPAS.map((pas) => pas.proof);
    const sharesToSend = filteredPAS.map((pas) => pas.decryptionCardShare);
    this.myPrivateCardsShares = proofsAndShares
      .filter((pas) => myPrivateCardsIndexes.includes(pas.cardIndex))
      .sort((a, b) => a.cardIndex - b.cardIndex)
      .map((pas) => pas) as [CardShareAndProof, CardShareAndProof];
    this.onChainDataSource.cardsDecryptionShares(this.tableInfo.id, sharesToSend, proofsToSend);
  }

  private async createAndShareSelfPrivateKeyShares(state: OnChainTableObject) {
    if (!this.myPrivateCardsShares) {
      this.myPrivateCardsShares = (await this.createDecryptionShareProofsFor(
        getPrivateCardsIndexes(state, this.playerId),
        state,
      )) as [CardShareAndProof, CardShareAndProof];
    }

    const proofsToSend = this.myPrivateCardsShares.map((pas) => pas.proof);
    const sharesToSend = this.myPrivateCardsShares.map((pas) => pas.decryptionCardShare);
    this.onChainDataSource.cardsDecryptionShares(this.tableInfo.id, sharesToSend, proofsToSend);
  }

  private async createDecryptionShareProofsFor(indexes: number[], state: OnChainTableObject) {
    const deck = getDeck(state);
    if (!deck) throw new Error("Deck must exist");

    const proofsAndShares: {
      proof: Proof;
      decryptionCardShare: DecryptionCardShare;
      cardIndex: number;
    }[] = [];

    for (const index of indexes) {
      proofsAndShares.push(
        await this.zkDeck
          .proveDecryptCardShare(this.secretKey, index, deck)
          .then((v) => Object.assign({ cardIndex: index as number }, v)),
      );
    }
    return proofsAndShares;
  }

  private async decryptPublicCards(state: OnChainTableObject, round: PublicCardRounds) {
    if (!this.zkDeck) throw new Error("zkDeck must have been created by now!");
    if (state.state.__variant__ !== "Playing") throw new Error("Invalid call");
    const deck = getDeck(state);
    if (!deck) throw new Error("state is wrong");

    const cardIndexes = getCardIndexes(state, round);
    const shares = getCardShares(state, cardIndexes);
    const cards = shares.map((share, index) =>
      this.zkDeck.decryptCard(cardIndexes[index]!, deck, [share]),
    );
    this.emit(GameEventTypes.RECEIVED_PUBLIC_CARDS, { cards, round } as ReceivedPublicCardsEvent);
  }

  private async decryptMyPrivateCards(state: OnChainTableObject) {
    if (!this.zkDeck) throw new Error("zkDeck must have been created by now!");
    if (state.state.__variant__ !== "Playing") throw new Error("Invalid call");
    const deck = getDeck(state);
    if (!deck) throw new Error("state is wrong");

    if (!this.myPrivateCardsShares) throw new Error("must be available");
    const [firstCardIndex, secondCardIndex] = getPrivateCardsIndexes(state, this.playerId);
    const firstCardShares = [
      getCardShares(state, firstCardIndex),
      this.myPrivateCardsShares[0].decryptionCardShare,
    ];
    const secondCardShares = [
      getCardShares(state, secondCardIndex),
      this.myPrivateCardsShares[1].decryptionCardShare,
    ];
    const firstPrivateCard = this.zkDeck.decryptCard(firstCardIndex, deck, firstCardShares);
    const secondPrivateCard = this.zkDeck.decryptCard(secondCardIndex, deck, secondCardShares);

    this.emit(GameEventTypes.RECEIVED_PRIVATE_CARDS, {
      cards: [firstPrivateCard, secondPrivateCard],
    });
  }

  private checkForActions(onChainTableObject: OnChainTableObject) {
    if (getShufflingPlayer(onChainTableObject)?.addr === this.playerId) {
      if (onChainTableObject.state.__variant__ !== "Playing")
        throw new Error("shuffle should only be called during playing");
      const publicKeys = onChainTableObject.roster.players.map((p) =>
        hexStringToUint8Array(p.public_key._0),
      );
      this.shuffle(hexStringToUint8Array(onChainTableObject.state.deck._0), publicKeys);
    }
    if (
      onChainDataMapper.convertGameStatus(onChainTableObject.state) === GameStatus.BetPreFlop &&
      getBettingPlayer(onChainTableObject)?.addr === this.playerId
    ) {
      // TODO: bet
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

  public raiseAmount(round: BettingRounds) {
    return [BettingRounds.PRE_FLOP, BettingRounds.FLOP].includes(round)
      ? this.tableInfo.smallBlind * 2
      : this.tableInfo.smallBlind * 4;
  }

  public placeBet(action: PlacingBettingActions) {
    console.log("placeBet called", action);
    return this.onChainDataSource.Bet(this.tableInfo.id, action);
  }

  public calculateAvailableActions(tableObject: OnChainTableObject): PlacingBettingActions[] {
    try {
      const self = onChainDataMapper.convertPlayer(getPlayerByAddress(tableObject, this.playerId)!);
      const round = getBettingRound(onChainDataMapper.convertGameStatus(tableObject.state));
      if (self.status === PlayerStatus.folded || self.status === PlayerStatus.sittingOut) return [];
      const actions = [PlacingBettingActions.FOLD, PlacingBettingActions.CHECK_CALL];
      if (self.status === PlayerStatus.allIn) return actions;
      const alreadyBettedAmount = self.bet;
      if (alreadyBettedAmount == null) throw new Error("should not be undefined");
      const maxBet = onChainDataMapper
        .convertPlayers(tableObject.roster.players, [])
        .reduce((maxBet, player) => (maxBet > player.bet! ? maxBet : player.bet!), 0);
      const expectedAmount = maxBet - self.bet! + this.raiseAmount(round);
      if (getNumberOfRaisesLeft(tableObject) > 0 && expectedAmount <= self.balance) {
        actions.push(PlacingBettingActions.RAISE);
      }
      return actions;
    } catch (e) {
      return [];
    }
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
    progressCallback?: (progress: number) => void,
  ) {
    console.log("Create table and join");
    const zkDeck = await createLocalZKDeck(zkFiles, ({ percentage }) => {
      progressCallback?.(percentage);
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
    progressCallback?: (progress: number) => void,
  ) {
    console.log("join table called");
    const zkDeck = await createLocalZKDeck(zkFiles, ({ percentage }) => {
      progressCallback?.(percentage);
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
