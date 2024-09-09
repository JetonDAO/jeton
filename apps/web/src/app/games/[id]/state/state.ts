import type { Game, GameState, GameStatus, Player } from "@jeton/ts-sdk";
import { type Observable, observable } from "@legendapp/state";

interface State {
  tableId?: string;
  loading: boolean;
  initializing: boolean;
  game?: Game;
  gameState?: {
    status: GameStatus;
    players: Player[];
    dealer: Player;
    shufflingPlayer?: Player;
  };
}

export const state$: Observable<State> = observable<State>({
  loading: true,
  initializing: false,
});
