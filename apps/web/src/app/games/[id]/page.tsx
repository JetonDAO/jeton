"use client";

export const runtime = "edge";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { GameEventTypes, GameStatus } from "@jeton/ts-sdk";
import { PlacingBettingActions, type Player } from "@jeton/ts-sdk";
import { useSelector } from "@legendapp/state/react";
import cardDealSound from "@src/assets/audio/card-place.mp3";
import Avatar1 from "@src/assets/images/avatars/avatar-1.png";
import Avatar2 from "@src/assets/images/avatars/avatar-2.png";
import Avatar3 from "@src/assets/images/avatars/avatar-3.png";
import Avatar4 from "@src/assets/images/avatars/avatar-4.png";
import Modal from "@src/components/Modal";
import { useAudio } from "@src/hooks/useAudio";
import { orderPlayersSeats } from "@src/utils/seat";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CARDS_MAP } from "../../../lib/constants/cards";
import Card from "./components/Card";
import Pot from "./components/Pot";
import PrivateCards from "./components/PrivateCards";
import PublicCards from "./components/PublicCards";
import ShufflingCards from "./components/ShufflingCards";
import { Table } from "./components/Table";
import WaitingIndicator from "./components/WaitingIndicator";
import { useSubscribeToGameEvent } from "./components/useSubscribeToGameEvent";
import { initGame, placeBet, setTableId } from "./state/actions/gameActions";
import {
  selectAvailableActions$,
  selectAwaitingBetFrom$,
  selectDealer$,
  selectGamePlayers$,
  selectGameStatus$,
  selectIsGameLoading$,
  selectMyCards$,
  selectPot$,
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

  const mainPlayer = useMemo(
    () => players?.find((player) => player.id === account?.address),
    [players, account],
  );

  const reorderedPlayers = !players || !mainPlayer ? [] : orderPlayersSeats(players, mainPlayer.id);

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
            (player, i) => player && <PlayerSeat key={player.id} player={player} seat={i + 1} />,
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

function PlayerSeat({ player, seat }: { player: Player; seat: number }) {
  const avatars = [Avatar1, Avatar2, Avatar3, Avatar4];
  const mounted = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const randomAvatar = useMemo(() => avatars[Math.floor(Math.random() * avatars.length)], [seat]);
  const shufflingPlayer = useSelector(selectShufflingPlayer$());
  const awaitingBetFrom = useSelector(selectAwaitingBetFrom$());
  const isPlayerTurn = awaitingBetFrom?.id === player.id;
  const myCards = useSelector(selectMyCards$());
  const dealer = useSelector(selectDealer$());

  const gameStatus = useSelector(selectGameStatus$());
  const [lastAction, setLastAction] = useState("");

  useEffect(() => {
    if (mounted.current) return;

    mounted.current = true;
  }, []);

  useEffect(() => {
    if (
      gameStatus === GameStatus.DrawRiver ||
      gameStatus === GameStatus.DrawFlop ||
      gameStatus === GameStatus.DrawTurn
    ) {
      setLastAction("");
    }
  }, [gameStatus]);

  useEffect(() => {
    setTimeout(() => {
      setLastAction("Raise $420");
    }, 1500);
  }, []);

  return (
    <div
      className={`seat-position items-center flex z-30 shrink-0 md:w-28 xl:w-32 w-10 grow-0 flex-col duration-1000 ${
        shufflingPlayer?.id === player.id ? "seat-dealer scale-110" : `seat-${seat}`
      }`}
      style={{ animationDelay: `${seat * 100 + 100}ms` }}
    >
      <Image
        draggable={false}
        src={randomAvatar ?? ""}
        alt="avatar"
        className={`w-full aspect-square animate-grow-in grow-0 sm:w-14 rounded-full shrink-0 border-2 md:border-8 ${
          shufflingPlayer?.id === player.id ? "scale-125 animate-bounce delay-1000" : ""
        } ${isPlayerTurn ? "ring-8 ring-blue-600 duration-500" : ""}`}
        style={{ transitionDelay: mounted.current ? "0ms" : `${150 * seat}ms` }}
      />
      {lastAction && (
        <div className="nes-balloon from-left z-50 animate-grow-in origin-bottom-left absolute -right-24 h-12 w-32 text-center !p-0">
          <p className="text-sm">{lastAction}</p>
        </div>
      )}
      {dealer?.id === player.id && (
        <span className="bg-white z-30 border rounded-full flex items-center justify-center shadow animate-grow-in absolute top-0 left-0 w-7 h-7">
          D
        </span>
      )}

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
      <div className="bg-[#b87d5b] shrink-0 flex-col rounded-sm line-clamp-1 relative flex justify-center text-[8px] text-white text-center shadow-2xl md:text-sm px-1 bg-opacity-80">
        <span>{player.id.slice(2, 8)} </span> <span>${player.balance}</span>
      </div>
    </div>
  );
}

function PlayerActions() {
  const availableActions = useSelector(selectAvailableActions$());
  const awaitingBetFrom = useSelector(selectAwaitingBetFrom$());
  const players = useSelector(selectGamePlayers$());
  const [queuedAction, setQueuedAction] = useState<string | null>(null);
  const [isActionQueued, setIsActionQueued] = useState(false);
  const { account } = useWallet();
  const mainPlayer = useMemo(
    () => players?.find((player) => player.id === account?.address),
    [players, account],
  );
  const isPlayerTurn = awaitingBetFrom?.id === mainPlayer?.id;
  const actions: PlacingBettingActions[] = [
    PlacingBettingActions.FOLD,
    PlacingBettingActions.CHECK_CALL,
    PlacingBettingActions.RAISE,
  ];

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
    <div className="fixed bottom-5 gap-5 flex justify-center w-full px-10">
      {availableActions &&
        availableActions?.length > 0 &&
        actions?.map((action) => (
          <button
            key={action}
            onClickCapture={() => {}}
            className={`bg-[#b87d5b] focus:outline-[#b87d5b] disabled:opacity-30 w-full py-4 text-lg text-white hover:brightness-90 ${
              isActionQueued && queuedAction === action ? "bg-opacity-50 cursor-not-allowed" : ""
            }`}
            onClick={() => placeBet(action)}
            disabled={isActionQueued || !availableActions?.includes(action)}
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

  let statusMessage = "Waiting for players...";

  if (shufflingPlayer?.id) {
    statusMessage = `Shuffling... ${shufflingPlayer.id.slice(2, 8)}'s turn to shuffle`;
  } else if (gameStatus === GameStatus.DrawPrivateCards) {
    statusMessage = "Dealing private cards...";
  } else if (awaitingBetFrom?.id) {
    statusMessage = `Awaiting bet from ${awaitingBetFrom.id.slice(2, 8)}`;
  } else if (gameStatus === GameStatus.BetPreFlop && myCards && myCards?.length > 0) {
    statusMessage = "Private cards dealt. Ready for Pre-Flop betting.";
  } else if (gameStatus) {
    statusMessage = `Current status: ${gameStatus}`;
  }

  return (
    <motion.div
      className="absolute top-4 left-4 bg-black bg-opacity-70 text-white p-3 rounded-lg shadow-md"
      key={statusMessage}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <p>{statusMessage}</p>
    </motion.div>
  );
}

function UnrevealedCards({ startRevealing }: { startRevealing: boolean }) {
  const [startAnimating, setStartAnimating] = useState(false);

  // Start animation after a short delay
  useEffect(() => {
    setTimeout(() => setStartAnimating(true), 200); // Delay to start animation
  }, []);

  return (
    <>
      {/* First card */}
      <motion.div
        className={`w-14 h-20 rounded-lg bg-[url("/images/card-back.png")] bg-no-repeat bg-contain justify-center grow-0 shrink-0 duration-[600ms] transition-all`}
        style={{
          position: "absolute",
          top: "50%", // Start at center of the screen
          left: "50%", // Start at center of the screen
          transform: "translate(-50%, -50%)", // Center the card exactly
          transformStyle: "preserve-3d",
        }}
        animate={{
          top: startAnimating ? "80%" : "50%", // Move to default seat position
          left: startAnimating ? "50%" : "50%", // Move to default seat position
          rotateY: startRevealing ? 180 : 0, // Flipping card on Y axis
        }}
        transition={{
          duration: 1,
          ease: "easeInOut",
        }}
      />

      {/* Second card */}
      <motion.div
        className={`w-14 h-20 rounded-lg bg-[url("/images/card-back.png")] bg-no-repeat bg-contain justify-center grow-0 shrink-0 duration-[600ms] transition-all`}
        style={{
          position: "absolute",
          top: "50%", // Start at center of the screen
          left: "50%", // Start at center of the screen
          transform: "translate(-50%, -50%)", // Center the card exactly
          transformStyle: "preserve-3d",
        }}
        animate={{
          top: startAnimating ? "80%" : "50%", // Move to default seat position
          left: startAnimating ? "50%" : "50%", // Move to default seat position
          rotateY: startRevealing ? 180 : 0, // Flipping card on Y axis
        }}
        transition={{
          duration: 1,
          delay: 0.2, // Add delay to stagger the two cards
          ease: "easeInOut",
        }}
      />
    </>
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
