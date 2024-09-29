import { ChipUnits, type TableInfo } from "@src/types/Table";
import { Jeton } from "./Jeton/Jeton";
import { AptosOnChainDataSource } from "./OnChainDataSource/AptosOnChainDataSource";
import { createTableInfo } from "./contracts/contractDataMapper";
import { getTableObject, getTableObjectAddresses } from "./contracts/contractInteractions";
const tables: TableInfo[] = [
  {
    id: "tbc11",
    smallBlind: 1,
    numberOfRaises: 2,
    minPlayers: 2,
    maxPlayers: 8,
    minBuyIn: 400,
    maxBuyIn: 2000,
    chipUnit: ChipUnits.apt,
  },
];

/**
 * should read different table parameters (probably from a contract) and return a list of them
 * @returns {TableInfo[]}
 */
export const getTablesInfo = async (): Promise<TableInfo[]> => {
  //TODO paginate
  const result = await getTableObjectAddresses();

  for (const event of result) {
    const tableObjectAddress = event.data.table_object.inner;
    const tableObjectResource = await getTableObject(tableObjectAddress);
    console.log(tableObjectResource);
    //TODO check table validation before push and end pagination
    const tableInfo = createTableInfo(tableObjectAddress, tableObjectResource);
    tables.push(tableInfo);
  }

  return tables;
};

export const getTableInfo = AptosOnChainDataSource.getTableInfo;

export const createTable = Jeton.createTableAndJoin;
