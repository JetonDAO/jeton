import {
  BettingActions,
  BettingRounds,
  PlacingBettingActions,
  type Player,
  PlayerStatus,
  type TableInfo,
} from "./types";

export class BettingManager {
  active: boolean;
  activeRound?: BettingRounds;
  previousBets: Record<string, number>;
  roundBets: Record<string, number>;
  lastRaised: Player | null;
  numberOfRaisesInRound: number;
  bigBlindPlaced: boolean;
  selfBettingState: {
    self: Player;
    preemptivelyPlacedBet?: PlacingBettingActions | null;
    alreadySentForRound: boolean;
  };
  lastBettingPlayer: Player | null;

  constructor(
    public players: Player[],
    public dealer: Player,
    public tableInfo: TableInfo,
    selfPlayer: Player,
  ) {
    this.active = false;
    this.lastRaised = null;
    this.roundBets = {};
    this.previousBets = {};
    for (const player of players) {
      this.roundBets[player.id] = 0;
      this.previousBets[player.id] = 0;
    }
    this.numberOfRaisesInRound = 0;
    this.bigBlindPlaced = false;
    this.lastBettingPlayer = null;
    this.selfBettingState = {
      self: selfPlayer,
      alreadySentForRound: false,
    };
  }

  startRound(round: BettingRounds) {
    this.activeRound = round;
    this.active = true;
    this.numberOfRaisesInRound = 0;
    this.selfBettingState.alreadySentForRound = false;
    this.selfBettingState.preemptivelyPlacedBet = null;
    this.lastRaised = null;
    this.lastBettingPlayer = null;
    if (round === BettingRounds.PRE_FLOP) {
      this.bigBlindPlaced = false;
    }
    if (round !== BettingRounds.PRE_FLOP) {
      for (const [id, bet] of Object.entries(this.roundBets)) {
        this.previousBets[id] += bet;
        this.roundBets[id] = 0;
      }
    }
    // TODO: handle bets
  }

  public get nextBettingPlayer() {
    if (!this.lastBettingPlayer) {
      return this.nextActivePlayer(this.dealer);
    }
    const nextActivePlayer = this.nextActivePlayer(this.lastBettingPlayer);
    if (
      !this.lastRaised &&
      this.activeRound !== BettingRounds.PRE_FLOP &&
      this.lastBettingPlayer === this.dealer
    )
      return null;
    if (
      !this.lastRaised &&
      this.activeRound === BettingRounds.PRE_FLOP &&
      this.bigBlindPlaced &&
      this.lastBettingPlayer === this.bigBlind
    )
      return null;
    if (nextActivePlayer === this.lastRaised) return null;
    return nextActivePlayer;
  }

  public get bigBlind() {
    // TODO: edge case: small and big blind are not active (sitting out)!
    const dealerIndex = this.players.findIndex((p) => p === this.dealer);
    const bigBlindIndex = (dealerIndex + 2) % this.players.length;
    return this.players[bigBlindIndex];
  }

  public nextActivePlayer(player: Player) {
    const currentPlayerIndex = this.players.findIndex((p) => p === player);
    if (currentPlayerIndex === -1) throw new Error("player does not exist");
    let nextPlayerIndex = (currentPlayerIndex + 1) % this.players.length;
    let nextPlayer = this.players[nextPlayerIndex] as Player;
    while (nextPlayer.status !== PlayerStatus.active) {
      nextPlayerIndex = (nextPlayerIndex + 1) % this.players.length;
      nextPlayer = this.players[nextPlayerIndex] as Player;
      if (nextPlayerIndex === currentPlayerIndex) throw new Error("there are no active players");
    }
    return nextPlayer;
  }

  public receivedBet(action: BettingActions, player: Player) {
    // TODO: is action valid
    if (player !== this.nextBettingPlayer)
      throw new Error("State mismatch received a bet out of turn");
    if (player === this.selfBettingState.self) {
      this.selfBettingState.alreadySentForRound = false;
    }
    if (action === BettingActions.BIG_BLIND) {
      this.bigBlindPlaced = true;
    }
    this.lastBettingPlayer = player;
    this.calculateNewBettingState(action, player);
    const pot = this.reconstructPot();
    return pot;
  }

  private calculateNewBettingState(action: BettingActions, sender: Player) {
    switch (action) {
      case BettingActions.FOLD:
        sender.status = PlayerStatus.folded;
        break;
      case BettingActions.SMALL_BLIND: {
        const amount = this.tableInfo.smallBlind;
        this.roundBets[sender.id] += amount;
        sender.balance -= amount;
        break;
      }
      case BettingActions.BIG_BLIND: {
        const amount = this.tableInfo.smallBlind * 2;
        this.numberOfRaisesInRound += 1;
        this.roundBets[sender.id] += amount;
        sender.balance -= amount;
        break;
      }
      case BettingActions.CHECK:
        break;
      // biome-ignore lint/suspicious/noFallthroughSwitchClause: <explanation>
      case BettingActions.RAISE:
        this.numberOfRaisesInRound += 1;
        if (this.numberOfRaisesInRound > this.tableInfo.numberOfRaises)
          throw new Error("received an illegal raise");
        this.lastRaised = sender;
      case BettingActions.CALL: {
        const totalRaisedAmount = this.numberOfRaisesInRound * this.raiseAmount;
        const amountNeededToCall = totalRaisedAmount - (this.roundBets[sender.id] as number);

        this.roundBets[sender.id] += amountNeededToCall;
        sender.balance -= amountNeededToCall;
        break;
      }
      case BettingActions.ALL_IN: {
        this.roundBets[sender.id] += sender.balance;
        sender.balance = 0;
        sender.status = PlayerStatus.allIn;
        break;
      }
      default:
        throw new Error("Unreachable Code");
    }
    if (sender.balance < 0) throw new Error("player balance should not be less than 0");
  }

  private reconstructPot() {
    const copiedBets: Record<string, number> = {};
    for (const player of this.players) {
      copiedBets[player.id] =
        (this.roundBets[player.id] as number) + (this.previousBets[player.id] as number);
    }
    const allInPlayers = this.players
      .filter((p) => p.status === PlayerStatus.allIn)
      .sort((p1, p2) => (copiedBets[p1.id] as number) - (copiedBets[p2.id] as number));

    const newPot = [];
    for (const allInPlayer of allInPlayers) {
      if (copiedBets[allInPlayer.id] === 0) continue;
      let sidePot = 0;
      for (const [id, bet] of Object.entries(copiedBets)) {
        if (bet > 0 && bet < (copiedBets[allInPlayer.id] as number)) {
          sidePot += bet;
          copiedBets[id] = 0;
        } else if (bet > 0) {
          sidePot += copiedBets[allInPlayer.id] as number;
          copiedBets[id] -= copiedBets[allInPlayer.id] as number;
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

  private get raiseAmount() {
    if (!this.active || !this.activeRound) throw new Error("betting round is not defined");
    return [BettingRounds.PRE_FLOP, BettingRounds.FLOP].includes(this.activeRound)
      ? this.tableInfo.smallBlind * 2
      : this.tableInfo.smallBlind * 4;
  }

  private convertBet(action: PlacingBettingActions): BettingActions {
    const alreadyBettedAmount = this.roundBets[this.selfBettingState.self.id];
    if (!alreadyBettedAmount) throw new Error("should not be undefined");
    switch (action) {
      case PlacingBettingActions.FOLD:
        return BettingActions.FOLD;
      // biome-ignore lint/suspicious/noFallthroughSwitchClause: <explanation>
      case PlacingBettingActions.RAISE: {
        const expectedAmount =
          (this.numberOfRaisesInRound + 1) * this.raiseAmount - alreadyBettedAmount;
        if (
          this.numberOfRaisesInRound < this.tableInfo.numberOfRaises &&
          expectedAmount < this.selfBettingState.self.balance
        ) {
          return BettingActions.RAISE;
        }
      }
      case PlacingBettingActions.CHECK_CALL: {
        if (!alreadyBettedAmount) throw new Error("should not be undefined");
        const expectedAmount = this.numberOfRaisesInRound * this.raiseAmount - alreadyBettedAmount;
        if (expectedAmount === 0) return BettingActions.CHECK;
        if (expectedAmount > this.selfBettingState.self.balance) return BettingActions.ALL_IN;
        return BettingActions.CALL;
      }
    }
  }

  public sendOrKeepSelfBet(
    send: (action: BettingActions) => void,
    placingAction?: PlacingBettingActions | BettingActions.BIG_BLIND,
  ) {
    const nextBettingPlayer = this.nextBettingPlayer;
    const isItMyTurn = nextBettingPlayer === this.selfBettingState.self;

    const placedBet = placingAction ?? this.selfBettingState.preemptivelyPlacedBet;
    const action =
      placedBet === BettingActions.BIG_BLIND
        ? BettingActions.BIG_BLIND
        : placedBet != null && this.convertBet(placedBet);

    const alreadySent = this.selfBettingState.alreadySentForRound;
    if (isItMyTurn && action && !alreadySent) {
      send(action);
      this.selfBettingState.alreadySentForRound = true;
      this.selfBettingState.preemptivelyPlacedBet = null;
      return true;
    }
    if (!isItMyTurn && placingAction && placingAction !== BettingActions.BIG_BLIND) {
      this.selfBettingState.preemptivelyPlacedBet = placingAction;
      return false;
    }
    return false;
  }
}
