"use client";

export const runtime = "edge";

import { type TableInfo, getTablesInfo } from "@jeton/ts-sdk";
import Modal from "@src/components/Modal";
import Spinner from "@src/components/Spinner";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function GameJoinModal() {
  const [gameTables, setGameTables] = useState<TableInfo[]>([]);
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const data = await getTablesInfo();
        setGameTables(data);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  if (!pathname.includes("join")) {
    return null;
  }

  // Modal choose violence and did not close on navigating
  if (!pathname.includes("join")) {
    return null;
  }

  return (
    <Modal
      className={`animate-scaleUp transition-all flex flex-col items-center overflow-y-scroll duration-1000 ${
        loading ? "max-h-80" : "max-h-[90dvh]"
      }`}
    >
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
                <span className="text-[#e0e0e0]">Buy-In:</span> {table.minBuyIn} - {table.maxBuyIn}
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
      )}
    </Modal>
  );
}
