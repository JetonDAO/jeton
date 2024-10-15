import { useSelector } from "@legendapp/state/react";
import chips from "@src/assets/images/chips/chips-3-stacks.png";
import Image from "next/image";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { selectGameStatus$, selectPot$ } from "../state/selectors/gameSelectors";

import { BettingActions, GameStatus } from "@jeton/ts-sdk";
import { mockPlayers } from "@src/lib/constants/mocks";
import type { UIPlayer } from "../state/state";

export default function Pot({ players }: { players: (UIPlayer | null)[] }) {
  const [started, setStarted] = useState(false);
  const [winning, setWinning] = useState(false);
  const [betting, setBetting] = useState(false);
  const pot = useSelector(selectPot$());
  const gameStatus = useSelector(selectGameStatus$());
  const raisedSeats = players.reduce<number[]>((acc, curr, i) => {
    if (
      curr &&
      (curr.roundAction?.action === BettingActions.CALL ||
        curr.roundAction?.action === BettingActions.RAISE)
    ) {
      acc.push(i + 1);
    }
    return acc;
  }, []);

  const winnerSeats = players?.reduce<number[]>((acc, curr, i) => {
    if (curr?.winAmount && curr.winAmount > 0) {
      acc.push(i + 1);
    }
    return acc;
  }, []);

  useEffect(() => {
    if (winnerSeats && winnerSeats?.length > 0) {
      setWinning(true);
      setTimeout(() => {
        setStarted(true);
      }, 2000);
    } else {
      setWinning(false);
    }
  }, [winnerSeats]);

  useEffect(() => {
    console.log(raisedSeats, winnerSeats);
  }, [winnerSeats, raisedSeats]);

  const raise = useCallback(() => {
    setBetting(true);

    setTimeout(() => {
      setStarted(true);

      setTimeout(() => {
        setBetting(false);
        setStarted(false);
      });
    }, 500);
  }, []);

  useEffect(() => {
    if (
      gameStatus === GameStatus.DrawRiver ||
      gameStatus === GameStatus.DrawFlop ||
      gameStatus === GameStatus.DrawTurn
    ) {
      if (raisedSeats.length > 0) {
        raise();
      } else {
        setWinning(false);
        setStarted(false);
      }
    }
  }, [gameStatus, raise, raisedSeats.length]);

  return (
    <>
      <div
        className={`text-white sm:text-lg text-[8px] items-center bg-black/20 px-2 sm:px-4 py-1 mt-2 absolute pot ${
          started ? "" : ""
        }`}
      >
        ${pot}
      </div>
      {betting &&
        raisedSeats.map((seat) => (
          <Image
            key={seat}
            className={`absolute duration-1000 w-8 h-8 sm:w-14 sm:h-14 ${
              started ? "pot animate-fading opacity-0" : `seat-${seat} opacity-0`
            }`}
            alt="chips"
            src={chips}
          />
        ))}

      {winning &&
        winnerSeats.map((seat) => (
          <Image
            key={seat}
            className={`absolute duration-[2s] w-8 h-8 sm:w-14 sm:h-14  ${
              started ? `seat-${seat} animate-fading opacity-0` : "pot opacity-0"
            }`}
            alt="chips"
            src={chips}
          />
        ))}
    </>
  );
}
