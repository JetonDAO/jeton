import {
  type BettingActions,
  type BettingRounds,
  GameStatus,
  type Jeton,
  type PlacingBettingActions,
  type Player,
} from "@jeton/ts-sdk";
import { type Observable, observable } from "@legendapp/state";

type GameState = {
  dealer?: Player;
  players: (Player | null)[];
  status?: GameStatus;
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
export interface State {
  tableId?: string;
  loading: boolean;
  downloadingAssets?: {
    loadingProgress: number;
  };
  initializing: boolean;
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
