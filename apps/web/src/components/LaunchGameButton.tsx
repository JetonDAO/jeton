"use client";
import { useRouter } from "next/navigation";
import type { FC } from "react";
export const LaunchGameButton: FC<{ tableId: string }> = ({ tableId }) => {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        router.push(`/games/${tableId}`);
      }}
    >
      enter this table
    </button>
  );
};
