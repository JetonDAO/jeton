"use client";

export const runtime = "edge";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { GameEventTypes } from "@jeton/ts-sdk";
import type { Player } from "@jeton/ts-sdk";
import Modal from "@jeton/ui/Modal";
import ProgressBar from "@jeton/ui/ProgressBar";
import { useSelector } from "@legendapp/state/react";
import Avatar1 from "@src/assets/images/avatars/avatar-1.png";
import Avatar2 from "@src/assets/images/avatars/avatar-2.png";
import Avatar3 from "@src/assets/images/avatars/avatar-3.png";
import Avatar4 from "@src/assets/images/avatars/avatar-4.png";
import Chips from "@src/assets/images/chips/chips-3-stacks.png";
import TableBackground from "@src/assets/images/table.png";
import type { CardName } from "@src/types";
import Image, { type StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Card from "./components/Card";
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
    <>
      <Table id={params.id}>
        {players?.map((player, i) => (
          <PlayerSeat key={player.id} player={player} seat={i + 1} />
        ))}
      </Table>
      <PlayerActions />

      <DownloadModal />
    </>
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
      <Modal className="w-96 h-52">
        <div className="flex flex-col items-center gap-1 text-white text-center">
          {percentage ? <ProgressBar progress={percentage} /> : "Starting download assets..."}
        </div>
      </Modal>
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
    <div className="flex justify-center p-20 relative -top-10">
      <Image
        priority
        className="h-full w-full object-contain -z-40 scale-125"
        src={TableBackground}
        alt="table"
      />
      {children}
      <div className="flex absolute top-[35%]">
        {cards.map((cardName) => (
          <Card
            className="scale-50 lg:scale-75 2xl:scale-100 animate-deal"
            key={cardName}
            cardName={cardName}
          />
        ))}
      </div>
    </div>
  );
}

function PlayerSeat({ player, seat }: { player: Player; seat: number }) {
  const cardsOnTable: CardName[] = ["clubs-02", "clubs-05"];
  const avatars = [Avatar1, Avatar2, Avatar3, Avatar4];
  const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
  const shufflingPlayer = useSelector(selectShufflingPlayer$());

  return (
    <div className={`player-position player-${seat} justify-center`}>
      <Image
        src={randomAvatar ?? ""}
        alt="avatar"
        className={`w-[150px] h-[150px] rounded-full border-8 ${
          shufflingPlayer?.id === player.id ? " border-green-500" : "border-[#b87d5b]"
        }`}
      />
      <Image className="chips w-16" src={Chips} alt="chips" />

      {seat === 1 && (
        <div className="flex justify-center absolute shrink-0 -right-[180%] bottom-0">
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
      <div className="bg-[#b87d5b]  overflow-hidden text-white text-center rounded-sm shadow-2xl text-sm w-32">
        {player.id}
      </div>
    </div>
  );
}

function PlayerActions() {
  const playerAction = ["Check", "Raise", "Fold"];

  return (
    <div className="flex items-center gap-5 justify-center">
      {playerAction.map((action) => (
        <button
          className="bg-[#b87d5b] py-6 px-12 text-lg hover:brightness-90 text-white border-2 border-[#3a3526]"
          key={action}
        >
          {action}
        </button>
      ))}
    </div>
  );
}

// import { TableComponent } from "./components/Table";

// export default function TablePage({ params }: { params: { id: string } }) {
//   return <TableComponent id={params.id} />;
// }
