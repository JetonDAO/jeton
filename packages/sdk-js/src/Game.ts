import { offChainEventFactory } from "@src/offChainEventFactory";
import { type GameState, GameStatus, type offChainTransport } from "@src/types";
import type { OffChainEvents } from "@src/types/OffChainEvents";

export type GameOptions = {
  offChainTransport: offChainTransport;
  tableId: string;
};

export class Game {
  private offChainTransport: offChainTransport;
  private tableId: string;
  private gameState: GameState;

  constructor(config: GameOptions) {
    this.offChainTransport = config.offChainTransport;
    this.tableId = config.tableId;
    // TODO
    this.gameState = {
      players: [],
      status: GameStatus.AwaitingStart,
      dealer: 0,
    };
  }

  public async checkIn(playerId: string): Promise<GameState> {
    const playerIds = await this.callCheckInContract(playerId);
    for (const id of playerIds) {
      this.gameState.players.push({ id, balance: 0, bet: 0 });
    }

    await this.initiateOffChainTransport();
    // tell other players you checkedIn
    this.offChainTransport.publish(
      "poker",
      offChainEventFactory.createCheckInEvent(playerId),
    );
    // TODO: here we need a way to construct consensus
    // we need this consensus algorithm for many different event too

    // wait until everyone acknowledge your checkIn
    // and construct full game state based on their responses

    return this.gameState;
  }

  private async callCheckInContract(playerId: string) {
    return ["john", "jane", "bob"];
  }

  private async initiateOffChainTransport() {
    await this.offChainTransport.create(this.tableId);
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
