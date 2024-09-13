import type { Game, GameState, GameStatus, Player } from "@jeton/ts-sdk";
import { type Observable, observable } from "@legendapp/state";

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
    status: null,
    dealer: null,
  },
});
