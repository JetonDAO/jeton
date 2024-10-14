import type { UIPlayer } from "@src/app/games/[id]/state/state";

export const orderPlayersSeats = (
  players: (UIPlayer | null)[],
  mainPlayerId: string,
): (UIPlayer | null)[] => {
  const mainPlayerIndex = players.findIndex((player) => player?.id === mainPlayerId);

  const mainPlayer = players[mainPlayerIndex];
  if (!mainPlayer) {
    return players;
  }

  const playersAfterMainPlayer: (UIPlayer | null)[] = players.slice(mainPlayerIndex + 1);
  const playersBeforeMainPlayer: (UIPlayer | null)[] = players.slice(0, mainPlayerIndex);
  return [mainPlayer, ...playersAfterMainPlayer, ...playersBeforeMainPlayer];
};
