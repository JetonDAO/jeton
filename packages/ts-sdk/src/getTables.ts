import { ChipUnits, type TableInfo } from "@src/types/Table";

const tables: TableInfo[] = [
  {
    id: "tbb01",
    smallBlind: 1,
    numberOfRaises: 1,
    minPlayers: 3,
    maxPlayers: 8,
    minBuyIn: 400,
    maxBuyIn: 2000,
    waitingBlocks: 2,
    chipUnit: ChipUnits.apt,
  },
];

/**
 * should read different table parameters (probably from a contract) and return a list of them
 * @returns {TableInfo[]}
 */
export const getTablesInfo = async (): Promise<TableInfo[]> => {
  return tables;
};

export const getTableInfo = async (id: string): Promise<TableInfo> => {
  const table = (await getTablesInfo()).find((table) => table.id === id);
  if (!table) throw new Error("table does not exist");
  return table;
};

export const createTable = async (
  smallBlind: number,
  numberOfRaises: number,
  minPlayers: number,
  maxPlayers: number,
  minBuyIn: number,
  maxBuyIn: number,
  waitingBlocks: number,
  chipUnit: ChipUnits,
): Promise<TableInfo> => {
  //const id = `tb${Math.floor(Math.random() * 100)}`;
  const id = "tb00";
  const newTable = {
    id,
    smallBlind,
    numberOfRaises,
    minPlayers,
    maxPlayers,
    minBuyIn,
    maxBuyIn,
    waitingBlocks,
    chipUnit,
  };
  tables.push(newTable);
  return newTable;
};
