"use client";

export const runtime = "edge";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { GameStatus } from "@jeton/ts-sdk";
import { useSelector } from "@legendapp/state/react";

import { orderPlayersSeats } from "@src/utils/seat";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import GameStatusBox from "./components/GameStatusBox";
import PlayerActions from "./components/PlayerActions";
import Pot from "./components/Pot";
import PrivateCards from "./components/PrivateCards";
import PublicCards from "./components/PublicCards";
import Seat from "./components/Seat";
import ShufflingCards from "./components/ShufflingCards";
import { Table } from "./components/Table";
import WaitingIndicator from "./components/WaitingIndicator";
import { initGame, setTableId } from "./state/actions/gameActions";
import {
  selectGamePlayers$,
  selectGameStatus$,
  selectPublicCards$,
  selectShufflingPlayer$,
} from "./state/selectors/gameSelectors";

export default function PlayPage({ params }: { params: { id: string } }) {
  const players = useSelector(selectGamePlayers$());
  const [toffState, setToffState] = useState(false);
  const shufflingPlayer = useSelector(selectShufflingPlayer$());
  const cards = useSelector(selectPublicCards$);
  const gameStatus = useSelector(selectGameStatus$());
  const [gameStarted, setGameStarted] = useState(true);
  const router = useRouter();
  const {
    connected,
    isLoading: isWalletLoading,
    signMessage,
    signAndSubmitTransaction,
    account,
  } = useWallet();

  const reorderedPlayers = useMemo(() => {
    const mainPlayer = players?.find((player) => player.id === account?.address);
    const reorderedPlayers =
      !players || !mainPlayer ? [] : orderPlayersSeats(players, mainPlayer.id);

    return reorderedPlayers;
  }, [players, account]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (gameStatus === GameStatus.Shuffle && !gameStarted) {
      setGameStarted(true);
    }
  }, [gameStatus]);

  useEffect(() => {
    if (!isWalletLoading && account) {
      initGame(account.address, signMessage, signAndSubmitTransaction);
    }
    setTableId(params.id);
  }, [params.id, signMessage, signAndSubmitTransaction, isWalletLoading, account]);

  useEffect(() => {
    if (!isWalletLoading && !connected && toffState) {
      router.push("/");
    } else if (!isWalletLoading && !connected) {
      setTimeout(() => setToffState(true), 100);
    }
  }, [isWalletLoading, connected, router, toffState]);

  return (
    <div
      className={`flex flex-col relative items-center justify-center py-2 bg-[url("/images/pixel-wooden-pattern.png")] bg-repeat bg-center bg-[length:120px_120px] overflow-hidden h-[100dvh] w-[100dvw] z-50 min-h-screen`}
    >
      <Table>
        {new Array(9)
          .fill(reorderedPlayers[0])
          ?.map(
            (player, i) => player && <Seat key={player.id} player={player} seatNumber={i + 1} />,
          )}
        {shufflingPlayer?.id && <ShufflingCards />}
        <div className="absolute flex flex-col justify-center items-center">
          {/* <PublicCards cards={[11, 22, 33, 44, 51]} />
          {gameStatus === GameStatus.AwaitingStart && <WaitingIndicator />} */}
        </div>
        <PrivateCards
          playersPrivateCards={{
            2: [1, 2],
            3: [11, 22],
            4: [14, 24],
            5: [16, 21],
            6: [31, 21],
            7: [21, 24],
            8: [41, 25],
            9: [31, 42],
          }}
        />
        {gameStarted && <Pot />}
      </Table>
      <PlayerActions />
      {/* <DownloadModal /> */}
      <GameStatusBox />
    </div>
  );
}

// mock shuffling for testing
// const [dealerSeat, setDealerSeat] = useState(1);

// useEffect(() => {
//   const timeout = setTimeout(() => {
//     const dealerInterval = setInterval(() => {
//       setDealerSeat((prevSeat) => (prevSeat < 9 ? prevSeat + 1 : 1));
//     }, 3000);

//     return () => clearInterval(dealerInterval);
//   }, 2000);

//   return () => clearTimeout(timeout);
// }, []);
