import type { MoveStructId } from "@aptos-labs/ts-sdk";

export const contractAddress = process.env.NEXT_PUBLIC_CONTRACTS_ADDR as string;
const appName = "texas_holdem";
const tableCreatedEvent = "TableCreatedEvent";
const tableType = "Table";

export const contractTableCreatedEventType =
  `${contractAddress}::${appName}::${tableCreatedEvent}` as MoveStructId;
export const contractTableType = `${contractAddress}::${appName}::${tableType}` as MoveStructId;

const createTable = "create_table";
export const contractCreateTableFunctionName =
  `${contractAddress}::${appName}::${createTable}` as MoveStructId;
