import { ChipUnits, type TableInfo } from "@src/types/Table";
import { createTableInfo } from "./contracts/contractDataMapper";
import {
  createTableObject,
  getTableObject,
  getTableObjectAddresses,
} from "./contracts/contractInteractions";
const tables: TableInfo[] = [
  {
    id: "tbc01",
    smallBlind: 1,
    numberOfRaises: 1,
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

export const getTableInfo = async (id: string): Promise<TableInfo> => {
  const tableObjectResource = await getTableObject(id);
  const tableInfo = createTableInfo(id, tableObjectResource);

  return tableInfo;
};

export const createTable = async (
  smallBlind: number,
  numberOfRaises: number,
  minPlayers: number,
  minBuyIn: number,
  maxBuyIn: number,
  waitingBlocks: number,
  chipUnit: ChipUnits,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  accountAddress: any,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  signAndSubmitTransaction: any,
): Promise<TableInfo> => {
  const [tableAddress, tablerResourceObject] = await createTableObject(
    smallBlind,
    numberOfRaises,
    minPlayers,
    minBuyIn,
    maxBuyIn,
    accountAddress,
    signAndSubmitTransaction,
  );
  const tableInfo = createTableInfo(tableAddress, tablerResourceObject);
  tables.push(tableInfo);

  return tableInfo;
};
