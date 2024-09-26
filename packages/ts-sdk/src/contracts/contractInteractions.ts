import type { GetEventsResponse } from "@aptos-labs/ts-sdk";
import type { WriteSetChange, WriteSetChangeWriteResource } from "@aptos-labs/ts-sdk";
import { ChipUnits, TableInfo } from "@src/types";
import { aptos } from "@src/utils/aptos";
import {
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

export const getTableObject = async (tableObjectAddress: string): Promise<GetEventsResponse> => {
  return aptos.getAccountResource({
    accountAddress: tableObjectAddress,
    resourceType: contractTableType,
  });
};

export const createTableObject = async (
  smallBlind: number,
  numberOfRaises: number,
  minPlayers: number,
  minBuyIn: number,
  maxBuyIn: number,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  accountAddress: any,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  signAndSubmitTransaction: any,
): Promise<[string, GetEventsResponse]> => {
  const submitCreateTableTransactionHash = await signAndSubmitTransaction({
    sender: accountAddress,
    data: {
      function: contractCreateTableFunctionName,
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

  const transactionData = await aptos.waitForTransaction({
    transactionHash: submitCreateTableTransactionHash.hash,
  });

  // biome-ignore lint/style/noNonNullAssertion: <explanation>
  const tableObjectAddress = transactionData.changes.find((change) =>
    isWriteSetChangeWriteResource(change),
  )!.address;

  const tableObjectResource = await getTableObject(tableObjectAddress);

  return [tableObjectAddress, tableObjectResource];
};

function isWriteSetChangeWriteResource(
  write: WriteSetChange,
): write is WriteSetChangeWriteResource {
  return (write as WriteSetChangeWriteResource) !== undefined;
}
