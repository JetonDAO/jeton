import type { GetEventsResponse } from "@aptos-labs/ts-sdk";
import type { WriteSetChange, WriteSetChangeWriteResource } from "@aptos-labs/ts-sdk";
import type { OnChainTableObject } from "@src/OnChainDataSource";
import { ChipUnits, TableInfo } from "@src/types";
import { aptos } from "@src/utils/aptos";
import {
  contractCheckInFunctionName,
  contractCreateTableFunctionName,
  contractTableCreatedEventType,
  contractTableType,
} from "./contractData";

//TODO apply pagination for getModuleEventsByEventType
export const getTableObjectAddresses = async (): Promise<GetEventsResponse> => {
  return aptos.getModuleEventsByEventType({
    eventType: contractTableCreatedEventType,
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
  const submitCheckInTransactionHash = await signAndSubmitTransaction({
    sender: address,
    data: {
      function: contractCheckInFunctionName,
      functionArguments: [tableObjetAddress, publicKey, buyInAmount],
    },
  });
  const transactionData = await aptos.waitForTransaction({
    transactionHash: submitCheckInTransactionHash.hash,
  });
  console.log("after tx hash", transactionData);
};

export const createTableObject = async (
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
  //TODO format public key before passing
  const submitCreateTableTransactionHash = await signAndSubmitTransaction({
    sender: accountAddress,
    data: {
      function: contractCreateTableFunctionName,
      functionArguments: [
        2 * 60,
        minBuyIn,
        maxBuyIn,
        smallBlind,
        numberOfRaises,
        minPlayers,
        9,
        publicKey,
        buyInAmount,
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
  return [tableWriteChange.address, tableWriteChange.data.data] as const;
};

function isWriteSetChangeWriteResource(
  write: WriteSetChange,
): write is WriteSetChangeWriteResource {
  return (write as WriteSetChangeWriteResource).data !== undefined;
}
