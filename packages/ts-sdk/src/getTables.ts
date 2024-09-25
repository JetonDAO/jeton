import { MoveStructId } from "@aptos-labs/ts-sdk";
import { ChipUnits, type TableInfo } from "@src/types/Table";
import { aptos } from "@src/utils/aptos";
import { contractCreateTable, contractTableCreatedEventType, contractTableType } from "./contracts";
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
//TODO apply pagination for getModuleEventsByEventType
export const getTablesInfo = async (): Promise<TableInfo[]> => {
  const result = await aptos.getModuleEventsByEventType({
    eventType: contractTableCreatedEventType,
  });

  for (const event of result) {
    const tableObjectAddress = event.data.table_object.inner;
    const tableObjectResource = await aptos.getAccountResource({
      accountAddress: tableObjectAddress,
      resourceType: contractTableType,
    });
    console.log(tableObjectResource);

    // const tableInfo :TableInfo = {
    //   id: ,
    //   smallBlind: ,
    //   numberOfRaises: ,
    //   minPlayers: ,
    //   maxPlayers: ,
    //   minBuyIn; ,
    //   maxBuyIn: ,
    //   waitingBlocks:
    // }
    //TODO map add @tableObjectResource
  }

  return tables;
};

export const getTableInfo = async (id: string): Promise<TableInfo> => {
  //TODO refactor table logic

  // const tableObjectResource = await aptos.getAccountResource({
  //   accountAddress: id,
  //   resourceType: contractTableType,
  // });
  // console.log(tableObjectResource);
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
      function: contractCreateTable,
      functionArguments: [
        1000,
        minBuyIn,
        maxBuyIn,
        2 * 60,
        smallBlind,
        numberOfRaises,
        8,
        minPlayers,
      ],
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
