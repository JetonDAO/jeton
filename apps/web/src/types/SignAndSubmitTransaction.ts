import type {
  AccountAddressInput,
  InputGenerateTransactionOptions,
  InputGenerateTransactionPayloadData,
  PendingTransactionResponse,
} from "@aptos-labs/ts-sdk";

export type SignAndSubmitTransaction = (args: {
  sender: AccountAddressInput;
  data: InputGenerateTransactionPayloadData;
  options?: InputGenerateTransactionOptions;
  withFeePayer?: boolean;
}) => Promise<PendingTransactionResponse>;
