"use client";

export const runtime = "edge";

import { type TableInfo, getTablesInfo } from "@jeton/ts-sdk";
import Modal from "@src/components/Modal";
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
      className={`animate-scaleUp transition-all duration-1000 ${
        loading ? "max-h-80" : "max-h-full"
      }`}
    >
      <div className="text-white text-2xl pb-10">Join a game</div>
      {gameTables.length > 0 ? (
        <ul className="text-white flex animate-grow-in flex-col p-2 bg-[#b87d5b]">
          {gameTables.map((table) => (
            <li key={table.id} className="relative flex flex-col">
              <div>Table ID: {table.id}</div>
              <div>Small Blind: {table.smallBlind}</div>
              <div>Number of Raises: {table.numberOfRaises}</div>
              <div>
                Players: {table.minPlayers} - {table.maxPlayers}
              </div>
              <div>
                Buy-In: {table.minBuyIn} - {table.maxBuyIn}
              </div>
              <div>Chip Unit: {table.chipUnit}</div>
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
      ) : (
        <div className="text-white">{loading ? "Loading tables..." : "No tables available"}</div>
      )}
    </Modal>
  );
}
