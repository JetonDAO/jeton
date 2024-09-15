import {
  type GameState as EntryGameState,
  type Game,
  GameStatus,
  type Player,
} from "@jeton/ts-sdk";
import { type Observable, observable } from "@legendapp/state";

type GameState = Omit<EntryGameState, "dealer"> & {
  dealer?: Player;
  shufflingPlayer?: Player;
};
//TODO: should I save game here?
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
    players: [],
    status: GameStatus.AwaitingStart,
    dealer: {} as Player,
  },
});
