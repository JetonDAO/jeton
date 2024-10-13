import {
  type BettingActions,
  type BettingRounds,
  GameStatus,
  type Jeton,
  type PlacingBettingActions,
  type Player,
} from "@jeton/ts-sdk";
import { type Observable, observable } from "@legendapp/state";

export type UIPlayer = Player & {
  roundAction?: {
    action: BettingActions;
    amount: number;
  };
  cards?: number[];
  winAmount?: number;
};

type GameState = {
  dealer?: UIPlayer;
  players: (UIPlayer | null)[];
  status?: GameStatus;
  shufflingPlayer?: UIPlayer;
  myCards?: [number, number];
  flopCards?: [number, number, number];
  turnCard?: [number];
  riverCard?: [number];
  pot: number;
  betState?: {
    round: BettingRounds;
    awaitingBetFrom?: UIPlayer;
    availableActions: PlacingBettingActions[];
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
    pot: 0,
    players: [],
    status: GameStatus.AwaitingStart,
    dealer: {} as Player,
  },
});
