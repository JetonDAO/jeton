import { ChipUnits, type TableInfo } from "@src/types";

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
type Table = any;

export const createTableInfo = (
  tableObjectAddress: string,
  tableObjectResource: Table,
): TableInfo => {
  //TODO check maxPlayers and minPlayers value
  const tableInfo: TableInfo = {
    id: tableObjectAddress,
    smallBlind: tableObjectResource.info.small_blind,
    numberOfRaises: tableObjectResource.info.num_raises,
    minPlayers: tableObjectResource.info.start_at_player,
    maxPlayers: tableObjectResource.start_at_player + 4,
    minBuyIn: tableObjectResource.info.min_buy_in_amount,
    maxBuyIn: tableObjectResource.info.max_buy_in_amount,
    chipUnit: ChipUnits.apt,
  };
  return tableInfo;
};
