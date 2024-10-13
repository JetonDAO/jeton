import type { MoveStructId } from "@aptos-labs/ts-sdk";

export const contractAddress = process.env.NEXT_PUBLIC_CONTRACTS_ADDR as string;
const appName = "holdem_table";
const tableType = "Table";

export const contractTableCreatedEventType =
  `${contractAddress}::${appName}::TableCreatedEvent` as MoveStructId;
export const contractCheckedInEventType =
  `${contractAddress}::${appName}::CheckedInEvent` as MoveStructId;
export const contractShuffleEventType =
  `${contractAddress}::${appName}::DeckShuffleEncryptedEvent` as MoveStructId;
export const contractCardDecryptionShareEventType =
  `${contractAddress}::${appName}::CardDecryptedShareEvent` as MoveStructId;
export const contractSmallBlindEventType =
  `${contractAddress}::${appName}::SmallBlindEvent` as MoveStructId;
export const contractBigBlindEventType =
  `${contractAddress}::${appName}::BigBlindEvent` as MoveStructId;
export const contractFoldEventType = `${contractAddress}::${appName}::FoldedEvent` as MoveStructId;
export const contractRaiseEventType = `${contractAddress}::${appName}::RaisedEvent` as MoveStructId;
export const contractCallEventType = `${contractAddress}::${appName}::CalledEvent` as MoveStructId;

export const contractTableType = `${contractAddress}::${appName}::${tableType}` as MoveStructId;

const createTable = "create_table";
export const contractCreateTableFunctionName =
  `${contractAddress}::${appName}::${createTable}` as MoveStructId;
export const contractCheckInFunctionName =
  `${contractAddress}::${appName}::check_in` as MoveStructId;
export const contractShuffleEncryptDeckFunctionName =
  `${contractAddress}::${appName}::shuffle_encrypt_deck` as MoveStructId;
export const contractDecryptShareFunctionName =
  `${contractAddress}::${appName}::decrypt_card_shares` as MoveStructId;
export const contractFoldFunctionName = `${contractAddress}::${appName}::fold` as MoveStructId;
export const contractCallFunctionName = `${contractAddress}::${appName}::call` as MoveStructId;
export const contractRaiseFunctionName = `${contractAddress}::${appName}::raise` as MoveStructId;

export const NODIT_GQL_ADDRESS =
  "https://aptos-testnet.nodit.io/tUOKeLdo0yUmJsNgwfln97h_03wYs8mP/v1/graphql";
