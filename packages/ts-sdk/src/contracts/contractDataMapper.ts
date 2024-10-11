import { ChipUnits, type TableInfo } from "@src/types";
import type { OnChainTableObject } from "../OnChainDataSource";

export const createTableInfo = (
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
    waitingTimeout: Number(tableObjectResource.config.action_timeout),
    chipUnit: ChipUnits.apt,
  };
  return tableInfo;
};
