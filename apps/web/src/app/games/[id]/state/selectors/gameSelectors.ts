import type { Player } from "@jeton/ts-sdk";
import type { Observable, ObservableBoolean } from "@legendapp/state";
import { state$ } from "../state";

export const selectIsGameLoading$: () => ObservableBoolean = () =>
  state$.loading;

export const selectGamePlayers$: () => Observable<Player[] | undefined> = () =>
  state$.gameState.players;
