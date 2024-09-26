"use client";

export const runtime = "edge";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { GameEventTypes, GameStatus } from "@jeton/ts-sdk";
import type { Player } from "@jeton/ts-sdk";
import Modal from "@jeton/ui/Modal";
import { useSelector } from "@legendapp/state/react";
import cardDealSound from "@src/assets/audio/card-place.mp3";
import Avatar1 from "@src/assets/images/avatars/avatar-1.png";
import Avatar2 from "@src/assets/images/avatars/avatar-2.png";
import Avatar3 from "@src/assets/images/avatars/avatar-3.png";
import Avatar4 from "@src/assets/images/avatars/avatar-4.png";
import Chips from "@src/assets/images/chips/chips-3-stacks.png";
import TableBackground from "@src/assets/images/table.png";
import { useAudio } from "@src/hooks/useAudio";
import type { CardName } from "@src/types";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { CARDS_MAP } from "../../../lib/constants/cards";
import Card from "./components/Card";
import ShufflingCards from "./components/ShufflingCards";
import { useSubscribeToGameEvent } from "./components/useSubscribeToGameEvent";
import { initGame, placeBet, setTableId } from "./state/actions/gameActions";
import {
  selectAvailableActions$,
  selectAwaitingBetFrom$,
  selectGamePlayers$,
  selectGameStatus$,
  selectIsGameLoading$,
  selectMyCards$,
  selectPot$,
  selectShufflingPlayer$,
} from "./state/selectors/gameSelectors";

const create9Slots = (players: Player[], mainPlayerId: string): (Player | null)[] => {
  const totalSeats = 9;
  const reorderedSeats: (Player | null)[] = new Array(totalSeats).fill(null);

  const mainPlayerIndex = players.findIndex((player) => player.id === mainPlayerId);

  const mainPlayer = players[mainPlayerIndex];
  if (!mainPlayer) {
    return reorderedSeats;
  }

  reorderedSeats[0] = mainPlayer;

  const playersAfterMainPlayer: Player[] = players.slice(mainPlayerIndex + 1);
  const playersBeforeMainPlayer: Player[] = players.slice(0, mainPlayerIndex);

  let seatIndex = 1;

  for (let i = 0; i < playersAfterMainPlayer.length && seatIndex < 9; i++) {
    const player = playersAfterMainPlayer[i];
    if (player) {
      reorderedSeats[seatIndex] = player;
      seatIndex++;
    }
  }

  for (let i = playersBeforeMainPlayer.length - 1; i >= 0 && seatIndex < 9; i--) {
    const player: Player | undefined = playersBeforeMainPlayer[i];

    if (player && typeof player === "object" && "id" in player) {
      reorderedSeats[9 - (playersBeforeMainPlayer.length - i)] = player;
    } else {
      reorderedSeats[9 - (playersBeforeMainPlayer.length - i)] = null;
    }
  }

  return reorderedSeats;
};

export default function PlayPage({ params }: { params: { id: string } }) {
  const players = useSelector(selectGamePlayers$());
  const [toffState, setToffState] = useState(false);
  const shufflingPlayer = useSelector(selectShufflingPlayer$());
  const { account } = useWallet();
  const mainPlayer = useMemo(
    () => players?.find((player) => player.id === account?.address),
    [players, account],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const reorderedPlayers = useMemo(
    () => players && mainPlayer && create9Slots(players, mainPlayer?.id),
    [players, players?.length, mainPlayer?.id],
  );

  const router = useRouter();
  const { connected, isLoading: isWalletLoading } = useWallet();

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
      <Table id={params.id}>
        {reorderedPlayers?.map(
          (player, i) => player && <PlayerSeat key={player.id} player={player} seat={i + 1} />,
        )}
        {shufflingPlayer?.id && <ShufflingCards />}
      </Table>
      <PlayerActions />
      <DownloadModal />
      <GameStatusBox />
    </div>
  );
}

function Table({ id, children }: { id: string; children: ReactNode }) {
  const {
    isLoading: isWalletLoading,
    signMessage,
    signAndSubmitTransaction,
    account,
  } = useWallet();

  useEffect(() => {
    if (!isWalletLoading && account) {
      initGame(account.address, signMessage, signAndSubmitTransaction);
    }
    setTableId(id);
  }, [id, signMessage, signAndSubmitTransaction, isWalletLoading, account]);

  const cards: CardName[] = ["hearts-J", "clubs-07", "spades-04", "diamonds-09", "spades-09"];

  return (
    <div className="flex justify-center items-center w-full h-full animate-grow-in">
      <div className="h-full-z-40 md:scale-x-100 max-w-[70dvh] md:scale-y-100 md:scale-100 w-full md:max-w-[90dvw] xl:max-w-[75dvw] md:max-h-[70dvh] duration-500 scale-x-150 scale-y-150 sm:scale-y-125 relative md:right-0 flex items-center justify-center">
        <Image
          draggable={false}
          priority
          className="object-fill w-full h-full rotate-90 md:rotate-0 md:max-h-[70dvh]"
          src={TableBackground}
          alt="table"
        />

        {children}
      </div>

      <div className="absolute flex ">
        {/* {cards.map((cardName) => (
          <Card
            className="xl:w-24 2xl:w-28 animate-deal w-12 sm:w-16"
            key={cardName}
            cardName={cardName}
          />
        ))} */}
      </div>
    </div>
  );
}

function PlayerSeat({ player, seat }: { player: Player; seat: number }) {
  const avatars = [Avatar1, Avatar2, Avatar3, Avatar4];
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const randomAvatar = useMemo(() => avatars[Math.floor(Math.random() * avatars.length)], [seat]);
  const shufflingPlayer = useSelector(selectShufflingPlayer$());
  const myCards = useSelector(selectMyCards$());

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

  return (
    <div
      data-dealer={true}
      className={`seat-position items-center animate-grow-in flex shrink-0 md:w-28 xl:w-32 w-10 grow-0 flex-col duration-1000 ${
        shufflingPlayer?.id === player.id ? "seat-dealer scale-110 group" : `seat-${seat}`
      }`}
      style={{ animationDelay: `${seat * 100 + 100}ms` }}
    >
      <Image
        draggable={false}
        src={randomAvatar ?? ""}
        alt="avatar"
        className={`w-full aspect-square grow-0 group-data-[dealer=true]:border-green-500 group-data-[dealer=true]:animate-bounce sm:w-14 rounded-full shrink-0 border-2 md:border-8 ${
          shufflingPlayer?.id === player.id ? " " : "border-transparent"
        }`}
      />
      <Image className="chips w-16 hidden" src={Chips} alt="chips" />

      {seat === 1 && myCards && myCards.length > 0 && (
        <div className="justify-center flex absolute shrink-0 -right-[200%] bottom-0">
          {myCards?.map(
            (cardName, i) =>
              CARDS_MAP[cardName] && (
                <Card
                  className={
                    i === 0 ? "animate-dealAndRotate1" : "animate-dealAndRotate2 relative right-14"
                  }
                  key={cardName}
                  cardName={CARDS_MAP[cardName]}
                />
              ),
          )}
        </div>
      )}
      <div className="bg-[#b87d5b] shrink-0 flex-col line-clamp-1 relative sm:bottom-2 flex justify-center text-[8px] text-white text-center rounded-sm shadow-2xl md:text-sm w-16 md:w-32">
        <span>{player.id.slice(2, 8)} </span> <span>${player.balance}</span>
      </div>
    </div>
  );
}

export function PlayerActions() {
  const availableActions = useSelector(selectAvailableActions$());
  const awaitingBetFrom = useSelector(selectAwaitingBetFrom$());
  const players = useSelector(selectGamePlayers$());

  console.log(availableActions);

  const [queuedAction, setQueuedAction] = useState<string | null>(null);
  const [isActionQueued, setIsActionQueued] = useState(false);

  const currentPlayer = players?.[0];

  const isPlayerTurn = awaitingBetFrom?.id === currentPlayer?.id;

  useEffect(() => {
    if (isPlayerTurn && queuedAction) {
      handlePlayerAction(queuedAction);
      setQueuedAction(null);
      setIsActionQueued(false);
    }
  }, [isPlayerTurn, queuedAction]);

  const handlePlayerAction = (action: string) => {
    if (isPlayerTurn) {
      console.log(`Executing action: ${action}`);
      takePlayerAction(action);
    } else {
      console.log(`Queued action: ${action}`);
      setQueuedAction(action);
      setIsActionQueued(true);
    }
  };

  const takePlayerAction = (action: string) => {
    console.log(`Action taken: ${action}`);
  };

  return (
    <div className="fixed bottom-5 gap-5 grid grid-cols-3">
      {availableActions?.map((action) => (
        <button
          key={action}
          onClickCapture={() => {}}
          className={`bg-[#b87d5b] py-4 text-lg text-white hover:brightness-90 ${
            isActionQueued && queuedAction === action ? "bg-opacity-50 cursor-not-allowed" : ""
          }`}
          onClick={() => placeBet(action)}
          disabled={isActionQueued}
        >
          {isActionQueued && queuedAction === action ? `${action} (Queued)` : action}
        </button>
      ))}
    </div>
  );
}

function DownloadModal() {
  const { isLoading: isWalletLoading } = useWallet();
  const [{ percentage }] = useSubscribeToGameEvent(GameEventTypes.DOWNLOAD_PROGRESS) || [
    { percentage: undefined },
  ];

  const isLoading = useSelector(selectIsGameLoading$()) || isWalletLoading;
  if (isLoading)
    return (
      <Modal className="w-96 h-52 animate-grow-in">
        <div className="flex flex-col items-center gap-1 text-white text-center">
          {percentage ? (
            <>
              <progress className="nes-progress is-success" value={percentage} max={100} />
              {`%${percentage}`}
            </>
          ) : (
            "Starting download assets..."
          )}
        </div>
      </Modal>
    );
}

function GameStatusBox() {
  const gameStatus = useSelector(selectGameStatus$());
  const shufflingPlayer = useSelector(selectShufflingPlayer$());
  const awaitingBetFrom = useSelector(selectAwaitingBetFrom$());
  const myCards = useSelector(selectMyCards$());
  const pot = useSelector(selectPot$());

  let statusMessage = "Waiting for players...";

  if (shufflingPlayer?.id) {
    statusMessage = `Shuffling... ${shufflingPlayer.id.slice(2, 8)}'s turn to shuffle`;
  } else if (gameStatus === GameStatus.DrawPrivateCards) {
    statusMessage = "Dealing private cards...";
  } else if (awaitingBetFrom?.id) {
    statusMessage = `Awaiting bet from ${awaitingBetFrom.id.slice(0, 4)}`;
  } else if (gameStatus === GameStatus.BetPreFlop && myCards && myCards?.length > 0) {
    statusMessage = "Private cards dealt. Ready for Pre-Flop betting.";
  } else if (gameStatus) {
    statusMessage = `Current status: ${gameStatus}`;
  }

  const potAmount = `Pot: ${pot?.reduce((sum: number, value: number) => sum + value, 0)}`;

  return (
    <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg shadow-md">
      <motion.div
        key={statusMessage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
      >
        <p>{statusMessage}</p>
      </motion.div>

      <motion.div
        key={potAmount}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="flex items-center gap-1 mt-1"
      >
        <p>{potAmount}</p>
        <i className="nes-icon coin is-small" />
      </motion.div>
    </div>
  );
}
