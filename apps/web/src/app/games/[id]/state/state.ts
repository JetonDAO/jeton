import type { Game, GameState } from "@jeton/sdk-js";
import { observable } from "@legendapp/state";

interface State {
  tableId?: string;
  loading: boolean;
  initializing: boolean;
  game?: Game;
  gameState?: GameState;
}

export const state$ = observable<State>({
  loading: true,
  initializing: false,
});
