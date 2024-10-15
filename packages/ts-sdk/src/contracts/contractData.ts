import type { MoveStructId } from "@aptos-labs/ts-sdk";

export const contractAddress = process.env.NEXT_PUBLIC_CONTRACTS_ADDR as string;
const appName = "holdem_table";
const tableType = "Table";

export const contractTableCreatedEventType =
  `${contractAddress}::${appName}::TableCreatedEvent` as const;
export const contractCheckedInEventType = `${contractAddress}::${appName}::CheckedInEvent` as const;
export const contractShuffleEventType =
  `${contractAddress}::${appName}::DeckShuffleEncryptedEvent` as const;
export const contractCardDecryptionShareEventType =
  `${contractAddress}::${appName}::CardDecryptedShareEvent` as const;
export const contractSmallBlindEventType =
  `${contractAddress}::${appName}::SmallBlindEvent` as const;
export const contractBigBlindEventType = `${contractAddress}::${appName}::BigBlindEvent` as const;
export const contractFoldEventType = `${contractAddress}::${appName}::FoldedEvent` as const;
export const contractRaiseEventType = `${contractAddress}::${appName}::RaisedEvent` as const;
export const contractCallEventType = `${contractAddress}::${appName}::CalledEvent` as const;
export const contractShowDownEventType = `${contractAddress}::${appName}::ShowdownEvent` as const;

export const contractTableType = `${contractAddress}::${appName}::${tableType}` as MoveStructId;

const createTable = "create_table";
export const contractCreateTableFunctionName =
  `${contractAddress}::${appName}::${createTable}` as const;
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
