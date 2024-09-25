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
  selfBettingState: {
    self: Player;
    preemptivelyPlacedBet?: PlacingBettingActions | null;
    alreadySentForRound: boolean;
  };
  lastBettingPlayer: Player | null;
  lastAction: BettingActions | null;
  smallBlind?: Player;
  bigBlind?: Player;

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
    this.lastBettingPlayer = null;
    this.lastAction = null;
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
    this.lastAction = null;
    if (round === BettingRounds.PRE_FLOP) {
      this.smallBlind = this.nextActivePlayer(this.dealer);
      this.bigBlind = this.nextActivePlayer(this.smallBlind);
    }
    if (round !== BettingRounds.PRE_FLOP) {
      for (const [id, bet] of Object.entries(this.roundBets)) {
        if (this.previousBets[id] === undefined) throw new Error("Unexpected Error");
        this.previousBets[id] += bet;
        this.roundBets[id] = 0;
      }
    }
  }

  public get nextBettingPlayer() {
    const lastBettingPlayerIndex = this.players.findIndex(
      (p) => p === (this.lastBettingPlayer ?? this.dealer),
    );
    if (lastBettingPlayerIndex === -1) throw new Error("player does not exist");
    let nextPlayerIndex = (lastBettingPlayerIndex + 1) % this.players.length;
    let nextPlayer = this.players[nextPlayerIndex] as Player;
    let previousPlayer = this.lastBettingPlayer;
    while (true) {
      if (
        !this.lastRaised &&
        this.activeRound !== BettingRounds.PRE_FLOP &&
        previousPlayer === this.dealer
      )
        return null;
      if (
        !this.lastRaised &&
        this.activeRound === BettingRounds.PRE_FLOP &&
        this.lastAction !== BettingActions.BIG_BLIND &&
        this.lastBettingPlayer === this.bigBlind
      )
        return null;
      if (nextPlayer === this.lastRaised) return null;
      if (nextPlayer.status === PlayerStatus.active) break;
      nextPlayerIndex = (nextPlayerIndex + 1) % this.players.length;
      previousPlayer = nextPlayer;
      nextPlayer = this.players[nextPlayerIndex] as Player;
      if (nextPlayerIndex === lastBettingPlayerIndex)
        throw new Error("there are no active players");
    }
    return nextPlayer;
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
    this.validateBet(action, player);
    if (player === this.selfBettingState.self) {
      this.selfBettingState.alreadySentForRound = false;
    }
    this.lastAction = action;
    this.lastBettingPlayer = player;
    this.calculateNewBettingState(action, player);
    const pot = this.reconstructPot();
    return pot;
  }

  private validateBet(action: BettingActions, player: Player) {
    if (player !== this.nextBettingPlayer)
      throw new Error("State mismatch received a bet out of turn");
    if (player.status !== PlayerStatus.active) throw new Error("only active players can bet");
    if (
      action === BettingActions.SMALL_BLIND &&
      (player !== this.smallBlind ||
        this.activeRound !== BettingRounds.PRE_FLOP ||
        this.lastAction != null)
    )
      throw new Error("Received invalid small blind");
    if (
      action === BettingActions.BIG_BLIND &&
      (player !== this.bigBlind ||
        this.activeRound !== BettingRounds.PRE_FLOP ||
        this.lastAction !== BettingActions.SMALL_BLIND)
    )
      throw new Error("Received invalid big blind");
    // illegal raise:
    if (
      action === BettingActions.RAISE &&
      (this.numberOfRaisesInRound === this.tableInfo.numberOfRaises ||
        (this.roundBets[player.id] as number) + player.balance <
          (this.numberOfRaisesInRound + 1) * this.raiseAmount)
    )
      throw new Error("received an illegal raise");

    if (
      action === BettingActions.CHECK &&
      (this.roundBets[player.id] as number) !== this.numberOfRaisesInRound * this.raiseAmount
    )
      throw new Error("received an illegal check");
  }

  private calculateNewBettingState(action: BettingActions, sender: Player) {
    switch (action) {
      case BettingActions.FOLD:
        sender.status = PlayerStatus.folded;
        break;
      case BettingActions.SMALL_BLIND: {
        const sb = this.tableInfo.smallBlind;
        const amount = sb > sender.balance ? sender.balance : sb;
        if (sb > sender.balance) sender.status = PlayerStatus.allIn;
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        this.roundBets[sender.id]! += amount;
        sender.balance -= amount;
        break;
      }
      case BettingActions.BIG_BLIND: {
        const bb = this.tableInfo.smallBlind * 2;
        const amount = bb > sender.balance ? sender.balance : bb;
        if (bb > sender.balance) sender.status = PlayerStatus.allIn;
        this.numberOfRaisesInRound += 1;
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        this.roundBets[sender.id]! += amount;
        sender.balance -= amount;
        break;
      }
      case BettingActions.CHECK:
        break;
      // biome-ignore lint/suspicious/noFallthroughSwitchClause: <explanation>
      case BettingActions.RAISE:
        this.numberOfRaisesInRound += 1;
        this.lastRaised = sender;
      case BettingActions.CALL: {
        const totalRaisedAmount = this.numberOfRaisesInRound * this.raiseAmount;
        const amountNeededToCall = totalRaisedAmount - (this.roundBets[sender.id] as number);
        const finalAmount =
          sender.balance > amountNeededToCall ? amountNeededToCall : sender.balance;

        if (sender.balance <= amountNeededToCall) sender.status = PlayerStatus.allIn;
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        this.roundBets[sender.id]! += finalAmount;
        sender.balance -= finalAmount;
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
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
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

  private get raiseAmount() {
    if (!this.active || !this.activeRound) throw new Error("betting round is not defined");
    return [BettingRounds.PRE_FLOP, BettingRounds.FLOP].includes(this.activeRound)
      ? this.tableInfo.smallBlind * 2
      : this.tableInfo.smallBlind * 4;
  }

  private convertBet(action: PlacingBettingActions): BettingActions {
    const alreadyBettedAmount = this.roundBets[this.selfBettingState.self.id];
    if (alreadyBettedAmount == null) throw new Error("should not be undefined");
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
        const expectedAmount = this.numberOfRaisesInRound * this.raiseAmount - alreadyBettedAmount;
        if (expectedAmount === 0) return BettingActions.CHECK;
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

  public get selfLegalActions(): PlacingBettingActions[] {
    if (!this.active) return [];
    const self = this.selfBettingState.self;
    if (self.status === PlayerStatus.folded || self.status === PlayerStatus.sittingOut) return [];
    const actions = [PlacingBettingActions.FOLD, PlacingBettingActions.CHECK_CALL];
    if (self.status === PlayerStatus.allIn) return actions;
    const alreadyBettedAmount = this.roundBets[this.selfBettingState.self.id];
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
}
