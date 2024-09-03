"use client";

import CardPlaceAudio from "@src/assets/audio/card-place.mp3";
import { useAudio } from "@src/hooks/useAudio";
import type { CardName } from "@src/types";
import { dealCards } from "@src/utils/gameFunctions";
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
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

  const hasDealtCards = useRef(false);
  const { play: playCardSound, reset: resetCardSound } =
    useAudio(CardPlaceAudio);

  useEffect(() => {
    if (hasDealtCards.current) return;

    hasDealtCards.current = true;

    dealCards(allCards, (newCard: CardName) => {
      setCardsOnTable((prevCards: CardName[]) => [...prevCards, newCard]);
      playCardSound();
    });

    return () => {
      resetCardSound();
    };
  }, [playCardSound, resetCardSound]);

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
