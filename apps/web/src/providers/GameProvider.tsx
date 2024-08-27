"use client";

import type { CardName } from "@src/types";
import { type ReactNode, createContext, useContext, useState } from "react";

export type GameState = {
  currentPlayer: number;
  cardsOnTable: CardName[];
  setCurrentPlayer: (player: number) => void;
};

const GameContext = createContext<GameState | undefined>(undefined);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [currentPlayer, setCurrentPlayer] = useState<number>(1);
  const cardsOnTable: CardName[] = [
    "hearts-J",
    "clubs-07",
    "spades-04",
    "diamonds-09",
    "spades-09",
  ];

  return (
    <GameContext.Provider
      value={{
        currentPlayer,
        cardsOnTable,
        setCurrentPlayer,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
