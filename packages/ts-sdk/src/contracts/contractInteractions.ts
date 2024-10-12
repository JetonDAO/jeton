import type { GetEventsResponse } from "@aptos-labs/ts-sdk";
import type { WriteSetChange, WriteSetChangeWriteResource } from "@aptos-labs/ts-sdk";
import type { OnChainTableObject, TableAddress } from "@src/OnChainDataSource";
import { aptos } from "@src/utils/aptos";
import { gql, request } from "graphql-request";
import {
  NODIT_GQL_ADDRESS,
  contractCardDecryptionShareEventType,
  contractCheckInFunctionName,
  contractCheckedInEventType,
  contractCreateTableFunctionName,
  contractDecryptShareFunctionName,
  contractShuffleEncryptDeckFunctionName,
  contractShuffleEventType,
  contractTableCreatedEventType,
  contractTableType,
} from "./contractData";

//TODO apply pagination for getModuleEventsByEventType
export const getTableObjectAddresses = async (): Promise<GetEventsResponse> => {
  return aptos.getModuleEventsByEventType({
    eventType: contractTableCreatedEventType,
    options: { orderBy: [{ transaction_block_height: "desc" }] },
  });
};

export const getTableObject = async (tableObjectAddress: string) => {
  return aptos
    .getAccountResource<OnChainTableObject>({
      accountAddress: tableObjectAddress,
      resourceType: contractTableType,
    })
    .then((r) => r);
};

export const callCheckInContract = async (
  address: string,
  buyInAmount: number,
  publicKey: Uint8Array,
  tableObjetAddress: string,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  signAndSubmitTransaction: any,
) => {
  console.log("call check-in contract", address, buyInAmount, publicKey, signAndSubmitTransaction);
  const submitCheckInTransactionHash = await signAndSubmitTransaction({
    sender: address,
    data: {
      function: contractCheckInFunctionName,
      functionArguments: [tableObjetAddress, buyInAmount, publicKey],
    },
  });
  const transactionData = await aptos.waitForTransaction({
    transactionHash: submitCheckInTransactionHash.hash,
  });
  console.log("after tx hash", transactionData);
};

export const callShuffleEncryptDeck = async (
  address: string,
  outDeck: Uint8Array,
  proof: Uint8Array,
  tableObjectAddress: string,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  signAndSubmitTransaction: any,
) => {
  console.log("call shuffle contract", address, outDeck, proof);
  const submittedTransaction = await signAndSubmitTransaction({
    sender: address,
    data: {
      function: contractShuffleEncryptDeckFunctionName,
      functionArguments: [tableObjectAddress, outDeck, proof],
    },
  });
  const transactionData = await aptos.waitForTransaction({
    transactionHash: submittedTransaction.hash,
  });
  console.log("shuffle transaction result", transactionData);
};
export const callDecryptCardShares = async (
  address: string,
  cardDecryptionShares: Uint8Array[],
  proofs: Uint8Array[],
  tableObjectAddress: string,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  signAndSubmitTransaction: any,
) => {
  console.log("call card decryption share contract", address, cardDecryptionShares, proofs);
  const submittedTransaction = await signAndSubmitTransaction({
    sender: address,
    data: {
      function: contractDecryptShareFunctionName,
      functionArguments: [tableObjectAddress, cardDecryptionShares, proofs],
    },
  });
  const transactionData = await aptos.waitForTransaction({
    transactionHash: submittedTransaction.hash,
  });
  console.log("shuffle transaction result", transactionData);
};

export const createTableObject = async (
  waitingTimeOut: number,
  smallBlind: number,
  numberOfRaises: number,
  minPlayers: number,
  minBuyIn: number,
  maxBuyIn: number,
  buyInAmount: number,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  accountAddress: any,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  publicKey: any,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  signAndSubmitTransaction: any,
) => {
  console.log("create table args", maxBuyIn, minBuyIn, waitingTimeOut);
  //TODO format public key before passing
  const submitCreateTableTransactionHash = await signAndSubmitTransaction({
    sender: accountAddress,
    data: {
      function: contractCreateTableFunctionName,
      functionArguments: [
        waitingTimeOut || 2 * 60,
        minBuyIn,
        maxBuyIn,
        smallBlind,
        numberOfRaises,
        minPlayers,
        9,
        buyInAmount,
        publicKey,
      ],
    },
  });

  const transactionData = await aptos.waitForTransaction({
    transactionHash: submitCreateTableTransactionHash.hash,
  });
  console.log("after tx hash", transactionData);

  const tableWriteChange = transactionData.changes.find(
    (change) => isWriteSetChangeWriteResource(change) && change.data.type === contractTableType,
  )! as WriteSetChangeWriteResource;

  console.log("transaction resource", tableWriteChange);
  return [tableWriteChange.address, tableWriteChange.data.data as OnChainTableObject] as [
    TableAddress,
    OnChainTableObject,
  ];
};

function isWriteSetChangeWriteResource(
  write: WriteSetChange,
): write is WriteSetChangeWriteResource {
  return (write as WriteSetChangeWriteResource).data !== undefined;
}

export async function queryEvents(tableId: string) {
  const document = gql`
        query MyQuery {
          events(
            where: {indexed_type: {_in: ["${contractTableCreatedEventType}", "${contractCheckedInEventType}","${contractShuffleEventType}", "${contractCardDecryptionShareEventType}"]},
            data: {_cast: {String: {_like: "%${tableId}%"}}}},
            order_by: {transaction_block_height: desc}
          ) {
          data,
          indexed_type,
          transaction_block_height
          }
        }`;
  //TODO: typing
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const res = await request<{ events: any[] }>(NODIT_GQL_ADDRESS, document);
  return res.events;
}
