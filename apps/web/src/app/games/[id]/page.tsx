"use client";

export const runtime = "edge";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { GameEventTypes } from "@jeton/ts-sdk";
import type { Player } from "@jeton/ts-sdk";
import Modal from "@jeton/ui/Modal";
import { useSelector } from "@legendapp/state/react";
import cardDealSound from "@src/assets/audio/card-place.mp3";
import Avatar1 from "@src/assets/images/avatars/avatar-1.png";
import Avatar2 from "@src/assets/images/avatars/avatar-2.png";
import Avatar3 from "@src/assets/images/avatars/avatar-3.png";
import Avatar4 from "@src/assets/images/avatars/avatar-4.png";
import Chips from "@src/assets/images/chips/chips-3-stacks.png";
import Flower from "@src/assets/images/decorations/flower.png";
import TableBackground from "@src/assets/images/table.png";
import { useAudio } from "@src/hooks/useAudio";
import type { CardName } from "@src/types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Card from "./components/Card";
import ShufflingCards from "./components/ShufflingCards";
import { useSubscribeToGameEvent } from "./components/useSubscribeToGameEvent";
import { initGame, setTableId } from "./state/actions/gameActions";
import {
  selectGamePlayers$,
  selectIsGameLoading$,
  selectShufflingPlayer$,
} from "./state/selectors/gameSelectors";

export default function PlayPage({ params }: { params: { id: string } }) {
  const players = useSelector(selectGamePlayers$());
  const [toffState, setToffState] = useState(false);

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
        {players?.map((player, i) => (
          <PlayerSeat key={player.id} player={player} seat={i + 1} />
        ))}
      </Table>
      <Image className="absolute right-0 scale-75" src={Flower} alt="flower" />
      <PlayerActions />
      <DownloadModal />
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

function Table({ id, children }: { id: string; children: ReactNode }) {
  const shufflingPlayer = useSelector(selectShufflingPlayer$());
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
    <div className="flex justify-center items-center w-full h-full">
      <div className="h-full-z-40 md:scale-x-100 max-w-[70dvh] md:scale-y-100 md:scale-100 w-full md:max-w-[90dvw] xl:max-w-[75dvw] md:max-h-[70dvh] duration-500 scale-x-150 scale-y-150 sm:scale-y-125 relative md:right-0 flex items-center justify-center">
        <Image
          priority
          className="object-fill w-full h-full rotate-90 md:rotate-0 md:max-h-[70dvh]"
          src={TableBackground}
          alt="table"
        />

        {children}
      </div>

      {shufflingPlayer?.id && <ShufflingCards />}

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
  const cardsOnTable: CardName[] = ["clubs-02", "clubs-05"];
  const avatars = [Avatar1, Avatar2, Avatar3, Avatar4];
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const randomAvatar = useMemo(() => avatars[Math.floor(Math.random() * avatars.length)], [seat]);
  const shufflingPlayer = useSelector(selectShufflingPlayer$());

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
      className={`seat-position items-center flex shrink-0 md:w-28 xl:w-32 w-10 grow-0 flex-col duration-1000 ${
        shufflingPlayer?.id === player.id ? "seat-dealer scale-110 group" : `seat-${seat}`
      }`}
    >
      <Image
        src={randomAvatar ?? ""}
        alt="avatar"
        className={`w-full aspect-square grow-0 group-data-[dealer=true]:border-green-500 group-data-[dealer=true]:animate-bounce sm:w-14 rounded-full shrink-0 border-2 md:border-8 ${
          shufflingPlayer?.id === player.id ? " " : "border-transparent"
        }`}
      />
      <Image className="chips w-16 hidden" src={Chips} alt="chips" />

      {seat === 1 && (
        <div className="justify-center hidden absolute shrink-0 -right-[180%] bottom-0">
          {cardsOnTable.map((cardName, i) => (
            <Card
              className={
                i === 0 ? "animate-dealAndRotate1" : "animate-dealAndRotate2 relative right-14"
              }
              key={cardName}
              cardName={cardName}
            />
          ))}
        </div>
      )}
      <div className="bg-[#b87d5b] shrink-0 line-clamp-1 relative sm:bottom-2 flex justify-center text-[8px] text-white text-center rounded-sm shadow-2xl md:text-sm w-16 md:w-32">
        {player.id} {seat}
      </div>
    </div>
  );
}

function PlayerActions() {
  const playerAction = ["Check", "Raise", "Fold"];

  return (
    <div className="gap-5 left-5 right-5 fixed bottom-5 grid grid-cols-3">
      {playerAction.map((action) => (
        <button
          className="bg-[#b87d5b] w-full py-4 text-lg hover:brightness-90 text-white border-2 border-[#3a3526]"
          key={action}
        >
          {action}
        </button>
      ))}
    </div>
  );
}
