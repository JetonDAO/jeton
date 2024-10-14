"use client";

export const runtime = "edge";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { GameStatus } from "@jeton/ts-sdk";
import { useSelector } from "@legendapp/state/react";

import { JetonContext } from "@src/components/JetonContextProvider";
import { mockPlayers } from "@src/lib/constants/mocks";
import { orderPlayersSeats } from "@src/utils/seat";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";
import React from "react";
import DownloadModal from "./components/DownloadModal";
import GameContainer from "./components/GameContainer";
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
  selectMyCards$,
  selectPublicCards$,
  selectShufflingPlayer$,
} from "./state/selectors/gameSelectors";

export default function PlayPage({ params }: { params: { id: string } }) {
  const { game, joinTable } = useContext(JetonContext);
  const players = useSelector(selectGamePlayers$());
  const [toffState, setToffState] = useState(false);
  const shufflingPlayer = useSelector(selectShufflingPlayer$());
  const gameStatus = useSelector(selectGameStatus$());
  const [drawPrivateCards, setDrawPrivateCards] = useState(false);
  const myCards = useSelector(selectMyCards$());
  const router = useRouter();
  const [privateCard, setPrivateCards] = useState<Record<number, number[]> | null>(null);
  const { connected, isLoading: isWalletLoading, signAndSubmitTransaction, account } = useWallet();

  const reorderedPlayers = useMemo(() => {
    const mainPlayer = players?.find((player) => player?.id === account?.address);
    return players && mainPlayer ? orderPlayersSeats(players, mainPlayer.id) : [];
  }, [players, players?.length, account]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (gameStatus === GameStatus.DrawPrivateCards && !drawPrivateCards) {
      setDrawPrivateCards(true);
    }
  }, [gameStatus]);

  useEffect(() => {
    if (!isWalletLoading && account && joinTable) {
      initGame(account.address, signAndSubmitTransaction, joinTable, game);
    }
    setTableId(params.id);
  }, [params.id, signAndSubmitTransaction, isWalletLoading, account, joinTable, game]);

  useEffect(() => {
    if (!isWalletLoading && !connected && toffState) {
      router.push("/");
    } else if (!isWalletLoading && !connected) {
      setTimeout(() => setToffState(true), 100);
    }
  }, [isWalletLoading, connected, router, toffState]);

  useEffect(() => {
    if (myCards && myCards.length > 0) {
      const privateCards = reorderedPlayers.reduce(
        (acc, player, seat) => {
          if (player) {
            acc[seat + 1] = player.cards ?? [];
          }
          return acc;
        },
        {} as Record<number, number[]>,
      );

      setPrivateCards(privateCards);
    }
  }, [reorderedPlayers, myCards]);

  return (
    <GameContainer>
      <Table>
        {reorderedPlayers.map(
          (player, i) => player && <Seat key={player.id} player={player} seatNumber={i + 1} />,
        )}
        {shufflingPlayer?.id && <ShufflingCards />}
        <div className="absolute flex flex-col justify-center items-center">
          <PublicCards />
          {gameStatus === GameStatus.AwaitingStart && <WaitingIndicator />}
        </div>

        {drawPrivateCards && (
          <>
            <PrivateCards playersPrivateCards={privateCard} />
            <Pot />
          </>
        )}
      </Table>
      <PlayerActions />
      <DownloadModal />
      <GameStatusBox />
    </GameContainer>
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
