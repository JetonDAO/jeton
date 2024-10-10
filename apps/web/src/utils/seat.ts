import type { Player } from "@jeton/ts-sdk";

export const orderPlayersSeats = (
  players: (Player | null)[],
  mainPlayerId: string,
): (Player | null)[] => {
  const mainPlayerIndex = players.findIndex((player) => player?.id === mainPlayerId);

  const mainPlayer = players[mainPlayerIndex];
  if (!mainPlayer) {
    return players;
  }

  const playersAfterMainPlayer: (Player | null)[] = players.slice(mainPlayerIndex + 1);
  const playersBeforeMainPlayer: (Player | null)[] = players.slice(0, mainPlayerIndex);
  return [mainPlayer, ...playersAfterMainPlayer, ...playersBeforeMainPlayer];
};
