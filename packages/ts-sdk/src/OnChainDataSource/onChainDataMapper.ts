import { getShufflingPlayer } from "@src/Jeton/helpers";
import type {
  ChipStack,
  OnChainActivePlayer,
  OnChainGameState,
  OnChainPendingPlayer,
  OnChainPhase,
  OnChainTableObject,
} from "@src/OnChainDataSource";
import { getTableObject } from "@src/contracts/contractInteractions";
import { ChipUnits, type TableInfo } from "@src/types";
import type { JGameState } from "../Jeton/Jeton";
import { GameStatus, type Player, PlayerStatus } from "../types";

function isActive(
  player: OnChainActivePlayer | OnChainPendingPlayer,
): player is OnChainActivePlayer {
  return (player as OnChainActivePlayer).bet != null;
}

export const chipStackToNumber = (stack: ChipStack) => {
  return Number(stack._0);
};

export const covertTableInfo = (
  tableObjectAddress: string,
  tableObjectResource: OnChainTableObject,
): TableInfo => {
  //TODO check maxPlayers and minPlayers value
  const tableInfo: TableInfo = {
    id: tableObjectAddress,
    smallBlind: Number(tableObjectResource.config.small_bet),
    numberOfRaises: Number(tableObjectResource.config.num_raises),
    minPlayers: Number(tableObjectResource.config.start_at_player),
    maxPlayers: Number(tableObjectResource.config.max_players),
    minBuyIn: Number(tableObjectResource.config.min_buy_in_amount),
    maxBuyIn: Number(tableObjectResource.config.max_buy_in_amount),
    chipUnit: ChipUnits.apt,
    waitingTimeout: Number(tableObjectResource.config.action_timeout),
  };
  return tableInfo;
};

const convertPlayer = (player: OnChainActivePlayer | OnChainPendingPlayer): Player => {
  if (isActive(player))
    return {
      id: player.addr,
      balance: chipStackToNumber(player.remaining),
      bet: chipStackToNumber(player.bet),
      status: player.is_folded
        ? PlayerStatus.folded
        : Number(player.remaining) === 0
          ? PlayerStatus.allIn
          : PlayerStatus.active,
    };

  return {
    id: player.addr,
    balance: chipStackToNumber(player.balance),
    bet: 0,
    status: PlayerStatus.sittingOut,
  };
};

const convertPlayers = (players: OnChainActivePlayer[], waitings: OnChainPendingPlayer[]) => {
  // TODO:
  const finalPlayers: Player[] = [];
  for (const player of players) {
    finalPlayers.push(convertPlayer(player));
  }

  for (const player of waitings) {
    finalPlayers.push(convertPlayer(player));
  }

  return finalPlayers;
};

const convertGameStatus = (state: OnChainGameState) => {
  switch (state.__variant__) {
    case "AwaitingStart":
    case "Removed":
      return GameStatus.AwaitingStart;
    case "Playing": {
      switch (state.phase.__variant__) {
        case "ShuffleEncrypt":
          return GameStatus.Shuffle;
        case "DrawPrivateCards":
          return GameStatus.DrawPrivateCards;
        case "BetFlop":
          return GameStatus.BetFlop;
        case "BetPreFlop":
          return GameStatus.BetPreFlop;
        case "BetTurn":
          return GameStatus.BetTurn;
        case "BetRiver":
          return GameStatus.BetRiver;
        case "DrawFlopCards":
          return GameStatus.DrawFlop;
        case "DrawTurnCard":
          return GameStatus.DrawTurn;
        case "DrawRiverCard":
          return GameStatus.DrawRiver;
        case "ShowDown":
          return GameStatus.ShowDown;
      }
    }
  }
};

const getDealerIndex = (tableObject: OnChainTableObject) => {
  const smallIndex = tableObject.roster.small_index;
  const numActivePlayers = tableObject.roster.players.length;
  const dealerIndex = smallIndex === 0 ? numActivePlayers - 1 : smallIndex - 1;
  return dealerIndex;
};

const convertJetonState = (state: OnChainTableObject): JGameState => {
  // TODO:
  const gameStatus = convertGameStatus(state.state);
  const onChainShufflingPlayer = getShufflingPlayer(state);
  return {
    dealerIndex: gameStatus === GameStatus.AwaitingStart ? 0 : getDealerIndex(state),
    players: convertPlayers(state.roster.players, state.roster.waitings),
    status: gameStatus,
    shufflingPlayer: onChainShufflingPlayer && convertPlayer(onChainShufflingPlayer),
  };
};

export default { convertPlayer, convertPlayers, convertJetonState, convertGameStatus };
