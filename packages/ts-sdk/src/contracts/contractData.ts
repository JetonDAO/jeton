import type { MoveStructId } from "@aptos-labs/ts-sdk";

export const contractAddress = process.env.NEXT_PUBLIC_CONTRACTS_ADDR as string;
const appName = "holdem_table";
const tableType = "Table";

export const contractTableCreatedEventType =
  `${contractAddress}::${appName}::TableCreatedEvent` as MoveStructId;
export const contractCheckedInEventType =
  `${contractAddress}::${appName}::CheckedInEvent` as MoveStructId;

export const contractTableType = `${contractAddress}::${appName}::${tableType}` as MoveStructId;

const createTable = "create_table";
export const contractCreateTableFunctionName =
  `${contractAddress}::${appName}::${createTable}` as MoveStructId;
export const contractCheckInFunctionName =
  `${contractAddress}::${appName}::check_in` as MoveStructId;
export const contractShuffleEncryptDeckFunctionName =
  `${contractAddress}::${appName}::shuffle_encrypt_deck` as MoveStructId;

export const NODIT_GQL_ADDRESS =
  "https://aptos-testnet.nodit.io/tUOKeLdo0yUmJsNgwfln97h_03wYs8mP/v1/graphql";
