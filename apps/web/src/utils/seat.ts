import type { Player } from "@jeton/ts-sdk";

export const orderPlayersSeats = (players: Player[], mainPlayerId: string): (Player | null)[] => {
  const totalSeats = 9;
  const reorderedSeats: (Player | null)[] = new Array(totalSeats).fill(null);

  const mainPlayerIndex = players.findIndex((player) => player.id === mainPlayerId);

  const mainPlayer = players[mainPlayerIndex];
  if (!mainPlayer) {
    return reorderedSeats;
  }

  reorderedSeats[0] = mainPlayer;

  const playersAfterMainPlayer: Player[] = players.slice(mainPlayerIndex + 1);
  const playersBeforeMainPlayer: Player[] = players.slice(0, mainPlayerIndex);

  let seatIndex = 1;

  for (let i = 0; i < playersAfterMainPlayer.length && seatIndex < 9; i++) {
    const player = playersAfterMainPlayer[i];
    if (player) {
      reorderedSeats[seatIndex] = player;
      seatIndex++;
    }
  }

  for (let i = playersBeforeMainPlayer.length - 1; i >= 0 && seatIndex < 9; i--) {
    const player: Player | undefined = playersBeforeMainPlayer[i];

    if (player && typeof player === "object" && "id" in player) {
      reorderedSeats[9 - (playersBeforeMainPlayer.length - i)] = player;
    } else {
      reorderedSeats[9 - (playersBeforeMainPlayer.length - i)] = null;
    }
  }

  return reorderedSeats;
};
