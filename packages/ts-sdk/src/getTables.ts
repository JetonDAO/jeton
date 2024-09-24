import { ChipUnits, type TableInfo } from "@src/types/Table";
import { aptos } from "@src/utils/aptos";
const tables: TableInfo[] = [
  {
    id: "tbc01",
    smallBlind: 1,
    numberOfRaises: 1,
    minPlayers: 2,
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
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  accountAddress: any,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  signAndSubmitTransaction: any,
): Promise<TableInfo> => {
  //TODO read contract address from env
  //TODO check create table model and and the smart contract function's inputs
  //TODO update buy in amount and action timeout and num_seets
  const submitCreateTableTransactionHash = await signAndSubmitTransaction({
    sender: accountAddress,
    data: {
      function:
        "0x24e807c6edb8e2ff4964d27e0254d5cb1e388fdf342652a34adbb564dea9d7fe::texas_holdem::create_table",
      functionArguments: [1000, minBuyIn, maxBuyIn, 20, smallBlind, numberOfRaises, 3, minPlayers],
    },
  });
  console.log("submitCreateTableTransactionHash", submitCreateTableTransactionHash);
  const tableObject = await aptos.waitForTransaction({
    transactionHash: submitCreateTableTransactionHash.hash,
  });
  console.log("table_object", tableObject);
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
