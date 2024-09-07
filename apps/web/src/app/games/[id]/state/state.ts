import type { Game, GameState } from "@jeton/sdk-js";
import { type Observable, observable } from "@legendapp/state";

interface State {
  tableId?: string;
  loading: boolean;
  initializing: boolean;
  game?: Game;
  gameState?: GameState;
}

export const state$: Observable<State> = observable<State>({
  loading: true,
  initializing: false,
});
