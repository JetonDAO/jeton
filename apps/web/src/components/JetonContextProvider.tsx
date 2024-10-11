"use client";
import { Jeton } from "@jeton/ts-sdk";
import { type PropsWithChildren, createContext, useCallback, useState } from "react";

export interface JetonContextValue {
  game?: Jeton;
  createTable?: (typeof Jeton)["createTableAndJoin"];
  joinTable?: (typeof Jeton)["joinTable"];
}
export const JetonContext = createContext<JetonContextValue>({});

export const JetonProvider = ({ children }: PropsWithChildren) => {
  const [game, setGame] = useState<Jeton>();

  const createTable: (typeof Jeton)["createTableAndJoin"] = useCallback(async (...args) => {
    const game = await Jeton.createTableAndJoin(...args);
    setGame(game);
    return game;
  }, []);

  const joinTable: (typeof Jeton)["joinTable"] = useCallback(async (...args) => {
    const game = await Jeton.joinTable(...args);
    setGame(game);
    return game;
  }, []);

  return (
    <JetonContext.Provider value={{ game, createTable, joinTable }}>
      {children}
    </JetonContext.Provider>
  );
};
