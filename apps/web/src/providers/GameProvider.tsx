"use client";

import CardPlaceAudio from "@src/assets/audio/card-place.mp3";
import type { CardName } from "@src/types";
import { dealCards, playSound } from "@src/utils/gameFunctions";
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

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
  const [cardsOnTable, setCardsOnTable] = useState<CardName[]>([]);

  const allCards: CardName[] = [
    "hearts-J",
    "clubs-07",
    "spades-04",
    "diamonds-09",
    "spades-09",
  ];

  useEffect(() => {
    dealCards(allCards, (newCard) => {
      setCardsOnTable((prevCards) => [...prevCards, newCard]);
      playSound(CardPlaceAudio);
    });
  }, []);

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
