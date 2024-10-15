"use client";

export const runtime = "edge";

import { AptosOnChainDataSource, type TableInfo } from "@jeton/ts-sdk";
import CheckIn from "@src/components/CheckIn";
import Modal from "@src/components/Modal";
import Spinner from "@src/components/Spinner";
import useCheckIn from "@src/hooks/useCheckIn";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function GameJoinModal() {
  const [gameTables, setGameTables] = useState<TableInfo[]>([]);
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const { checkIn, submitCheckIn } = useCheckIn();
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!isJoining) return;

    const fetchTables = async () => {
      try {
        if (!checkIn) throw new Error("You shall check in my friend");
        const data = await AptosOnChainDataSource.getTablesInfo();
        const tables = data.filter((table) => {
          return table.maxBuyIn >= checkIn && table.minBuyIn <= checkIn;
        });
        setGameTables(tables);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, [isJoining, checkIn]);

  if (!pathname.includes("join")) {
    return null;
  }

  // Modal choose violence and did not close on navigating
  if (!pathname.includes("join")) {
    return null;
  }

  return (
    <Modal
      className={`animate-scaleUp transition-all flex flex-col items-center overflow-y-scroll max-w-md duration-1000 ${
        loading ? "max-h-96" : "max-h-[90dvh]"
      }`}
      closeButton
    >
      {isJoining ? (
        <>
          <div className="text-white text-2xl pb-10">Join a game</div>
          {gameTables.length > 0 ? (
            <ul className="text-white flex animate-grow-in flex-col gap-5 ">
              {gameTables.map((table) => (
                <li key={table.id} className="relative flex flex-col p-5 bg-[#b87d5b]">
                  <div>
                    <span className="text-[#e0e0e0]">Table ID:</span> {table.id.slice(0, 8)}
                  </div>
                  <div>
                    <span className="text-[#e0e0e0]">Small Blind:</span> {table.smallBlind}
                  </div>
                  <div>
                    <span className="text-[#e0e0e0]">Number of Raises:</span> {table.numberOfRaises}
                  </div>
                  <div>
                    <span className="text-[#e0e0e0]">Players:</span> {table.minPlayers} -{" "}
                    {table.maxPlayers}
                  </div>
                  <div>
                    <span className="text-[#e0e0e0]">Buy-In:</span> {table.minBuyIn} -{" "}
                    {table.maxBuyIn}
                  </div>
                  <div>
                    <span className="text-[#e0e0e0]">Chip Unit:</span> {table.chipUnit}
                  </div>
                  <Link
                    prefetch
                    className="nes-btn is-primary mt-3 p-1 text-xs self-center"
                    href={`/games/${table.id}`}
                  >
                    join
                  </Link>
                </li>
              ))}
            </ul>
          ) : loading ? (
            <div className="text-white flex-col flex gap-3 items-center animate-grow-in">
              <Spinner />
              Loading tables
            </div>
          ) : (
            <div className="text-white ">No tables available</div>
          )}{" "}
        </>
      ) : (
        <CheckIn
          onSubmit={(value) =>
            submitCheckIn(value, () => {
              setIsJoining(true);
            })
          }
        />
      )}
    </Modal>
  );
}
