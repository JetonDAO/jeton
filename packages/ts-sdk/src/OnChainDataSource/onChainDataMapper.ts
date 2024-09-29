import type { OnChainPlayer, OnChainTableObject } from "@src/OnChainDataSource";
import type { JGameState, Seats } from "../Jeton/Jeton";
import { type Player, PlayerStatus } from "../types";

const convertPlayer = (player: OnChainPlayer): Player => {
  return {
    id: player.addr,
    balance: Number(player.balance),
    bet: Number(player.bet),
    status: player.is_folded
      ? PlayerStatus.folded
      : Number(player.balance) === 0
        ? PlayerStatus.allIn
        : player.is_playing
          ? PlayerStatus.active
          : PlayerStatus.sittingOut,
    elGamalPublicKey: Uint8Array.from(player.public_key),
  };
};

const convertSeats = (seats: OnChainTableObject["seets"]): Seats => {
  // TODO:
  //@ts-ignore
  const transformedSeats: Seats = [];
  for (const seat of seats) {
    const player = seat.vec[0];
    if (player) {
      transformedSeats.push(convertPlayer(player));
    } else {
      transformedSeats.push(null);
    }
  }

  return transformedSeats;
};

const convertJetonState = (
  state: Pick<OnChainTableObject, "seets" | "phase" | "time_out" | "dealer_index">,
): JGameState => {
  // TODO:
  console.log("state is", state);
  return {
    dealerIndex: state.dealer_index,
    seats: convertSeats(state.seets),
  };
};

export default { convertSeats, convertJetonState };
