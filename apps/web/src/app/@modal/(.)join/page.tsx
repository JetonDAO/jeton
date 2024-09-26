"use client";

export const runtime = "edge";

import { type TableInfo, getTablesInfo } from "@jeton/ts-sdk";
import Modal from "@jeton/ui/Modal";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function GameJoinModal() {
  const [gameTables, setGameTables] = useState<TableInfo[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    const fetchTables = async () => {
      const data = await getTablesInfo();
      setGameTables(data);
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
    <Modal className="animate-scaleUp">
      <div className="text-white text-2xl pb-10">Join a game</div>
      {gameTables.length > 0 ? (
        <ul className="text-white border flex flex-col p-2 bg-[#b87d5b]">
          {gameTables.map((table) => (
            <li key={table.id} className="mb-4 relative">
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
                className="nes-btn is-primary px-2 py-1 text-xs absolute bottom-1 right-1"
                href={`/games/${table.id}`}
              >
                join
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-white">No tables available</div>
      )}
    </Modal>
  );
}
