import type { GameEventMap, GameEventTypes } from "@jeton/ts-sdk";
import { useSelector } from "@legendapp/state/react";
import { useEffect, useState } from "react";
import { state$ } from "../state/state";

export const useSubscribeToGameEvent = <T extends keyof GameEventMap>(event: T) => {
  const game = useSelector(state$.game);
  const [eventState, setEventState] = useState<GameEventMap[T]>();

  useEffect(() => {
    const listener = (...args: GameEventMap[T]) => {
      setEventState(args);
    };
    // biome-ignore lint/suspicious/noExplicitAny:
    game?.addListener?.(event, listener as any);

    return () => {
      // biome-ignore lint/suspicious/noExplicitAny:
      game?.removeListener?.(event, listener as any);
    };
  }, [game, event]);

  return eventState;
};
