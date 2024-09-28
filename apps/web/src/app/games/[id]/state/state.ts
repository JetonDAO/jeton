import {
  type BettingActions,
  type BettingRounds,
  type GameState as EntryGameState,
  type Game,
  GameStatus,
  type PlacingBettingActions,
  type Player,
} from "@jeton/ts-sdk";
import { type Observable, observable } from "@legendapp/state";

type GameState = Omit<EntryGameState, "dealer"> & {
  dealer?: Player;
  shufflingPlayer?: Player;
  myCards?: [number, number];
  flopCards?: [number, number, number];
  turnCard?: [number];
  riverCard?: [number];
  pot: number[];
  betState?: {
    round: BettingRounds;
    awaitingBetFrom?: Player;
    availableActions: PlacingBettingActions[];
    lastBet?: {
      player: Player;
      action: BettingActions;
      amount: number;
    };
    placedBet?: PlacingBettingActions | null;
  };
};
// TODO: should I save game here?
export interface State {
  tableId?: string;
  loading: boolean;
  initializing: boolean;
  game?: Game;
  gameState?: GameState;
}

export const state$: Observable<State> = observable<State>({
  loading: true,
  initializing: false,
  gameState: {
    pot: [0],
    players: [],
    status: GameStatus.AwaitingStart,
    dealer: {} as Player,
  },
});
