import { BettingManager } from "./BettingManager";
import {
  BettingActions,
  BettingRounds,
  ChipUnits,
  PlacingBettingActions,
  type Player,
  PlayerStatus,
  type TableInfo,
} from "./types";

describe("tests different betting functionalities of betting manager", () => {
  test("one round of pre-flop betting", () => {
    const players: Player[] = [
      { id: "1", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "2", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.sittingOut },
      { id: "3", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "4", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
    ];
    const tableInfo: TableInfo = {
      id: "tbc01",
      smallBlind: 1,
      numberOfRaises: 1,
      minPlayers: 2,
      maxPlayers: 8,
      minBuyIn: 400,
      maxBuyIn: 2000,
      chipUnit: ChipUnits.apt,
    };

    const bettingManager = new BettingManager(
      players,
      players[0] as Player,
      tableInfo,
      players[0] as Player,
    );
    bettingManager.startRound(BettingRounds.PRE_FLOP);
    expect(bettingManager.nextBettingPlayer).toBe(players[2]);
    expect(bettingManager.smallBlind).toBe(players[2]);
    expect(bettingManager.bigBlind).toBe(players[3]);

    let pot = bettingManager.receivedBet(BettingActions.SMALL_BLIND, players[2] as Player);
    expect(pot).toEqual([1]);
    expect(bettingManager.nextBettingPlayer).toBe(players[3]);

    pot = bettingManager.receivedBet(BettingActions.BIG_BLIND, players[3] as Player);
    expect(pot).toEqual([3]);
    expect(bettingManager.nextBettingPlayer).toBe(players[0]);

    pot = bettingManager.receivedBet(BettingActions.CALL, players[0] as Player);
    expect(pot).toEqual([5]);
    expect(bettingManager.nextBettingPlayer).toBe(players[2]);

    bettingManager.receivedBet(BettingActions.FOLD, players[2] as Player);
    pot = bettingManager.receivedBet(BettingActions.FOLD, players[3] as Player);
    expect(pot).toEqual([5]);
    expect(bettingManager.nextBettingPlayer).toBeNull();
  });
  test("betting round finishes on dealer in flop", () => {
    const players: Player[] = [
      { id: "0", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "1", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.folded },
      { id: "2", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "3", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.allIn },
      { id: "4", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
    ];
    const tableInfo: TableInfo = {
      id: "tbc01",
      smallBlind: 1,
      numberOfRaises: 1,
      minPlayers: 2,
      maxPlayers: 8,
      minBuyIn: 400,
      maxBuyIn: 2000,
      chipUnit: ChipUnits.apt,
    };

    const bettingManager = new BettingManager(
      players,
      players[1] as Player,
      tableInfo,
      players[0] as Player,
    );
    bettingManager.startRound(BettingRounds.FLOP);
    bettingManager.receivedBet(BettingActions.CHECK, players[2] as Player);
    bettingManager.receivedBet(BettingActions.CHECK, players[4] as Player);
    bettingManager.receivedBet(BettingActions.CHECK, players[0] as Player);
    expect(bettingManager.nextBettingPlayer).toBeNull();
  });

  test("full round with raise and fold", () => {
    const players: Player[] = [
      { id: "0", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "1", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "2", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "3", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "4", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
    ];
    const tableInfo: TableInfo = {
      id: "tbc01",
      smallBlind: 1,
      numberOfRaises: 3,
      minPlayers: 2,
      maxPlayers: 8,
      minBuyIn: 400,
      maxBuyIn: 2000,
      chipUnit: ChipUnits.apt,
    };

    const bettingManager = new BettingManager(
      players,
      players[3] as Player,
      tableInfo,
      players[0] as Player,
    );
    bettingManager.startRound(BettingRounds.PRE_FLOP);
    bettingManager.receivedBet(BettingActions.SMALL_BLIND, players[4] as Player);
    bettingManager.receivedBet(BettingActions.BIG_BLIND, players[0] as Player);
    bettingManager.receivedBet(BettingActions.CALL, players[1] as Player);
    bettingManager.receivedBet(BettingActions.RAISE, players[2] as Player);
    bettingManager.receivedBet(BettingActions.CALL, players[3] as Player);
    bettingManager.receivedBet(BettingActions.CALL, players[4] as Player);
    bettingManager.receivedBet(BettingActions.FOLD, players[0] as Player);
    const pot = bettingManager.receivedBet(BettingActions.FOLD, players[1] as Player);
    expect(bettingManager.nextBettingPlayer).toBeNull();
    expect(pot).toEqual([1 + 2 + 2 + 4 + 4 + 3]);

    bettingManager.startRound(BettingRounds.FLOP);
    bettingManager.receivedBet(BettingActions.RAISE, players[4] as Player);
    bettingManager.receivedBet(BettingActions.RAISE, players[2] as Player);
    bettingManager.receivedBet(BettingActions.RAISE, players[3] as Player);
    bettingManager.receivedBet(BettingActions.CALL, players[4] as Player);
    const flopPot = bettingManager.receivedBet(BettingActions.CALL, players[2] as Player);
    expect(bettingManager.nextBettingPlayer).toBeNull();
    expect(flopPot).toEqual([(pot[0] as number) + 2 + 4 + 6 + 4 + 2]);
    expect(players[4]?.status).toBe(PlayerStatus.allIn);
    expect(players[0]?.status).toBe(PlayerStatus.folded);
  });

  test("betting round with multiple side pots", () => {
    const players: Player[] = [
      { id: "0", balance: 5, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active }, //1,4
      { id: "1", balance: 8, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active }, //1,4,1
      { id: "2", balance: 1, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active }, //1,0,
      { id: "3", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active }, //1,4,1
      { id: "4", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active }, //1,0,0
    ];
    const tableInfo: TableInfo = {
      id: "tbc01",
      smallBlind: 1,
      numberOfRaises: 3,
      minPlayers: 2,
      maxPlayers: 8,
      minBuyIn: 400,
      maxBuyIn: 2000,
      chipUnit: ChipUnits.apt,
    };

    const bettingManager = new BettingManager(
      players,
      players[3] as Player,
      tableInfo,
      players[0] as Player,
    );
    bettingManager.startRound(BettingRounds.PRE_FLOP);
    bettingManager.receivedBet(BettingActions.SMALL_BLIND, players[4] as Player);
    bettingManager.receivedBet(BettingActions.BIG_BLIND, players[0] as Player);
    bettingManager.receivedBet(BettingActions.RAISE, players[1] as Player);
    bettingManager.receivedBet(BettingActions.CALL, players[2] as Player);
    bettingManager.receivedBet(BettingActions.RAISE, players[3] as Player);
    bettingManager.receivedBet(BettingActions.FOLD, players[4] as Player);
    bettingManager.receivedBet(BettingActions.CALL, players[0] as Player);
    const pot = bettingManager.receivedBet(BettingActions.CALL, players[1] as Player);
    expect(bettingManager.nextBettingPlayer).toBeNull();
    expect(pot).toEqual([5, 12, 2]);
  });
  test("only two players", () => {
    const players: Player[] = [
      { id: "0", balance: 50, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "1", balance: 50, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
    ];

    const tableInfo: TableInfo = {
      id: "tbc01",
      smallBlind: 1,
      numberOfRaises: 3,
      minPlayers: 2,
      maxPlayers: 8,
      minBuyIn: 400,
      maxBuyIn: 2000,
      chipUnit: ChipUnits.apt,
    };
    const bettingManager = new BettingManager(
      players,
      players[0] as Player,
      tableInfo,
      players[0] as Player,
    );

    bettingManager.startRound(BettingRounds.PRE_FLOP);
    bettingManager.receivedBet(BettingActions.SMALL_BLIND, players[1] as Player);
    bettingManager.receivedBet(BettingActions.BIG_BLIND, players[0] as Player);
    bettingManager.receivedBet(BettingActions.CALL, players[1] as Player);
    bettingManager.receivedBet(BettingActions.CALL, players[0] as Player);
    expect(bettingManager.nextBettingPlayer).toBeNull();

    bettingManager.startRound(BettingRounds.FLOP);
    bettingManager.receivedBet(BettingActions.CHECK, players[1] as Player);
    bettingManager.receivedBet(BettingActions.CHECK, players[0] as Player);
    expect(bettingManager.nextBettingPlayer).toBeNull();

    bettingManager.startRound(BettingRounds.TURN);
    bettingManager.receivedBet(BettingActions.RAISE, players[1] as Player);
    bettingManager.receivedBet(BettingActions.RAISE, players[0] as Player);
    bettingManager.receivedBet(BettingActions.CALL, players[1] as Player);
    expect(bettingManager.nextBettingPlayer).toBeNull();
  });
});

describe("testing different scenarios of self bet placing", () => {
  const tableInfo: TableInfo = {
    id: "tbc01",
    smallBlind: 1,
    numberOfRaises: 3,
    minPlayers: 2,
    maxPlayers: 8,
    minBuyIn: 400,
    maxBuyIn: 2000,
    chipUnit: ChipUnits.apt,
  };
  test("simply placing a bet early", () => {
    const players: Player[] = [
      { id: "0", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "1", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "2", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
    ];
    const bettingManager = new BettingManager(
      players,
      players[0] as Player,
      tableInfo,
      players[0] as Player,
    );
    const sendfn = jest.fn();
    bettingManager.startRound(BettingRounds.PRE_FLOP);
    bettingManager.sendOrKeepSelfBet(sendfn, PlacingBettingActions.CHECK_CALL);
    expect(sendfn).not.toHaveBeenCalled();
    bettingManager.receivedBet(BettingActions.SMALL_BLIND, players[1] as Player);
    bettingManager.receivedBet(BettingActions.BIG_BLIND, players[2] as Player);
    bettingManager.sendOrKeepSelfBet(sendfn);
    expect(sendfn).toHaveBeenCalledWith(BettingActions.CALL);
  });

  test("placing a bet right on time", () => {
    const players: Player[] = [
      { id: "0", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "1", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "2", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
    ];
    const bettingManager = new BettingManager(
      players,
      players[0] as Player,
      tableInfo,
      players[0] as Player,
    );
    const sendfn = jest.fn();
    bettingManager.startRound(BettingRounds.PRE_FLOP);
    bettingManager.receivedBet(BettingActions.SMALL_BLIND, players[1] as Player);
    bettingManager.receivedBet(BettingActions.BIG_BLIND, players[2] as Player);
    bettingManager.sendOrKeepSelfBet(sendfn, PlacingBettingActions.FOLD);
    expect(sendfn).toHaveBeenCalledWith(BettingActions.FOLD);
  });

  test("placing a bet on time but without value", () => {
    const players: Player[] = [
      { id: "0", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "1", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "2", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
    ];
    const bettingManager = new BettingManager(
      players,
      players[0] as Player,
      tableInfo,
      players[0] as Player,
    );
    const sendfn = jest.fn();
    bettingManager.startRound(BettingRounds.PRE_FLOP);
    bettingManager.receivedBet(BettingActions.SMALL_BLIND, players[1] as Player);
    bettingManager.receivedBet(BettingActions.BIG_BLIND, players[2] as Player);
    bettingManager.sendOrKeepSelfBet(sendfn);
    expect(sendfn).not.toHaveBeenCalled();
  });

  test("raising without balance", () => {
    const players: Player[] = [
      { id: "0", balance: 1, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "1", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "2", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
    ];
    const bettingManager = new BettingManager(
      players,
      players[0] as Player,
      tableInfo,
      players[0] as Player,
    );
    const sendfn = jest.fn();
    bettingManager.startRound(BettingRounds.PRE_FLOP);
    bettingManager.receivedBet(BettingActions.SMALL_BLIND, players[1] as Player);
    bettingManager.receivedBet(BettingActions.BIG_BLIND, players[2] as Player);
    bettingManager.sendOrKeepSelfBet(sendfn, PlacingBettingActions.RAISE);
    expect(sendfn).toHaveBeenCalledWith(BettingActions.CALL);
    const didSend = bettingManager.sendOrKeepSelfBet(sendfn, PlacingBettingActions.RAISE);
    expect(didSend).toBeFalsy();
    expect(sendfn).toHaveBeenCalledTimes(1);
  });

  test("raising with balance", () => {
    const players: Player[] = [
      { id: "0", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "1", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "2", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
    ];
    const bettingManager = new BettingManager(
      players,
      players[0] as Player,
      tableInfo,
      players[0] as Player,
    );
    const sendfn = jest.fn();
    bettingManager.startRound(BettingRounds.PRE_FLOP);
    bettingManager.receivedBet(BettingActions.SMALL_BLIND, players[1] as Player);
    bettingManager.receivedBet(BettingActions.BIG_BLIND, players[2] as Player);
    bettingManager.sendOrKeepSelfBet(sendfn, PlacingBettingActions.RAISE);
    expect(sendfn).toHaveBeenCalledWith(BettingActions.RAISE);
    const didSend = bettingManager.sendOrKeepSelfBet(sendfn, PlacingBettingActions.RAISE);
    expect(didSend).toBeFalsy();
    expect(sendfn).toHaveBeenCalledTimes(1);
  });
});

describe("receiving different illegal bets", () => {
  test("bet out of turn, bet when not active", () => {
    const tableInfo: TableInfo = {
      id: "tbc01",
      smallBlind: 1,
      numberOfRaises: 3,
      minPlayers: 2,
      maxPlayers: 8,
      minBuyIn: 400,
      maxBuyIn: 2000,
      chipUnit: ChipUnits.apt,
    };
    const players: Player[] = [
      { id: "0", balance: 1, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "1", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.folded },
      { id: "2", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
    ];
    const bettingManager = new BettingManager(
      players,
      players[0] as Player,
      tableInfo,
      players[0] as Player,
    );
    bettingManager.startRound(BettingRounds.FLOP);
    expect(() => {
      bettingManager.receivedBet(BettingActions.CALL, players[0] as Player);
    }).toThrow();
    expect(() => {
      bettingManager.receivedBet(BettingActions.RAISE, players[1] as Player);
    }).toThrow();
    expect(() => {
      bettingManager.receivedBet(BettingActions.RAISE, players[1] as Player);
    }).toThrow();
    expect(() => {
      bettingManager.receivedBet(BettingActions.SMALL_BLIND, players[2] as Player);
    }).toThrow();
    expect(() => {
      bettingManager.receivedBet(BettingActions.BIG_BLIND, players[2] as Player);
    }).toThrow();
  });

  test("raise and check errors", () => {
    const tableInfo: TableInfo = {
      id: "tbc01",
      smallBlind: 1,
      numberOfRaises: 2,
      minPlayers: 2,
      maxPlayers: 8,
      minBuyIn: 400,
      maxBuyIn: 2000,
      chipUnit: ChipUnits.apt,
    };
    const players: Player[] = [
      { id: "0", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "1", balance: 10, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
      { id: "2", balance: 1, elGamalPublicKey: ["a", "a"], status: PlayerStatus.active },
    ];
    const bettingManager = new BettingManager(
      players,
      players[0] as Player,
      tableInfo,
      players[0] as Player,
    );
    bettingManager.startRound(BettingRounds.RIVER);
    bettingManager.receivedBet(BettingActions.RAISE, players[1] as Player);
    expect(() => {
      bettingManager.receivedBet(BettingActions.RAISE, players[2] as Player);
    }).toThrow();
    bettingManager.receivedBet(BettingActions.CALL, players[2] as Player);
    bettingManager.receivedBet(BettingActions.RAISE, players[0] as Player);
    expect(() => {
      bettingManager.receivedBet(BettingActions.RAISE, players[1] as Player);
    }).toThrow();
    expect(() => {
      bettingManager.receivedBet(BettingActions.CHECK, players[1] as Player);
    }).toThrow();
  });
});
