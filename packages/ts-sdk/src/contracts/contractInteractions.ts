import type { GetEventsResponse } from "@aptos-labs/ts-sdk";
import { U8, type WriteSetChange, type WriteSetChangeWriteResource } from "@aptos-labs/ts-sdk";
import { aptos } from "@src/utils/aptos";
import { HexString } from "aptos";
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
  accountAddress: string,
  publicKey: string,
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  signAndSubmitTransaction: any,
): Promise<[string, GetEventsResponse]> => {
  // const encoder = new TextEncoder();
  // const uint8ArrayAccountAddress = encoder.encode(accountAddress);

  //const publicKeyHex = Buffer.from(publicKey).toString("hex");
  //console.log(publicKeyHex.length);

  // const publicKeyUintArray = new HexString(publicKeyHex).toUint8Array();

  //const publicKey: Uint8Array = new HexString(accountAddress).toUint8Array();
  // Correct use of slice (ensure start and end indices are valid)

  //console.log(accountAddress);
  //const account = new AptosAccount();

  // 2. Get the public key as a Uint8Array
  //const publicKeyBytes = account.signingKey.publicKey;

  //const gg = new HexString(hexify(publicKeyUintArray)).toUint8Array();
  //console.log(gg);
  //console.log(publicKey);

  // const fake: Account = Account.generate();
  // const resss = fake.publicKey.toUint8Array();

  // const aptTrans = await aptos.transaction.build.simple({
  //   sender: fake.accountAddress,
  //   data: {
  //     function: contractCreateTableFunctionName,
  //     functionArguments: [
  //       2 * 60,
  //       minBuyIn,
  //       maxBuyIn,
  //       smallBlind,
  //       numberOfRaises,
  //       minPlayers,
  //       9,
  //       resss,
  //       1000,
  //     ],
  //   },
  // });

  // const pendingTransaction = await aptos.signAndSubmitTransaction({
  //   signer: fake,
  //   transaction: aptTrans,
  // });
  //const publicKey: Uint8Array = new Uint8Array([1, 2, 3, 4]); // Ensure it has valid data

  const w = new HexString(publicKey).toUint8Array();

  // If the byteArray is smaller than the targetLength, fill it from the end of the array

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
        [w],
        1000,
      ],
    },
  });

  const transactionData = await aptos.waitForTransaction({
    transactionHash: submitCreateTableTransactionHash.hash,
  });

  const tableObjectAddress = transactionData.changes.find((change) =>
    isWriteSetChangeWriteResource(change),
  )!.address;

  const tableObjectResource = await getTableObject(tableObjectAddress);

  return [tableObjectAddress, tableObjectResource];
};

function hexify(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => {
      let hex = byte.toString(16);
      if (hex.length === 1) {
        hex = `0${hex}`;
      }
      return hex;
    })
    .join("");
}

function isWriteSetChangeWriteResource(
  write: WriteSetChange,
): write is WriteSetChangeWriteResource {
  return (write as WriteSetChangeWriteResource) !== undefined;
}
