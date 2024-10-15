import {
  Account,
  Aptos,
  AptosConfig,
  type Ed25519Account,
  Ed25519PrivateKey,
  Network,
} from "@aptos-labs/ts-sdk";
import type { SignAndSubmitTransaction } from "@src/types/SignAndSubmitTransaction";
const config = new AptosConfig({ network: Network.TESTNET });
export const aptos = new Aptos(config);

function createSignAndSubmit(account: Ed25519Account) {
  const signAndSubmit: SignAndSubmitTransaction = async (args) => {
    const transaction = await aptos.transaction.build.simple(args);
    const pendingTransaction = await aptos.signAndSubmitTransaction({
      signer: account,
      transaction,
    });
    return pendingTransaction;
  };
  return signAndSubmit;
}

function createAccount() {
  const account = Account.generate();
  // in case we don't want to ask user to transfer funds
  // Fund the account on chain. Funding an account creates it on-chain.
  // await aptos.fundAccount({
  //   accountAddress: accountAddress,
  //   amount: 100000000,
  // });
  const hexPrivateKey = account.privateKey.toString();
  localStorage.setItem("inAppWalletKey", hexPrivateKey);

  const address = account.accountAddress.toString();
  console.log("string of address", address);

  const signAndSubmit = createSignAndSubmit(account);
  return [address, signAndSubmit] as const;
}

function restoreAccount() {
  const hexPrivateKey = localStorage.getItem("inAppWalletKey");
  if (!hexPrivateKey) throw new Error("does not exist");

  const account = Account.fromPrivateKey({ privateKey: new Ed25519PrivateKey(hexPrivateKey) });
  const address = account.accountAddress.toString();
  const signAndSubmit = createSignAndSubmit(account);
  return [address, signAndSubmit] as const;
}

export function retrieveInAppAccount() {
  let address: `0x${string}`;
  let signAndSubmit: SignAndSubmitTransaction;

  try {
    [address, signAndSubmit] = restoreAccount();
  } catch (e) {
    [address, signAndSubmit] = createAccount();
  }
  return [address, signAndSubmit] as const;
}

export function askedInAppDialog() {
  return localStorage?.getItem("walletDialog") !== null;
}

export function useInAppWallet() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("walletDialog") === "use";
}

export function setInAppWalletStatus(use: boolean) {
  if (use) {
    localStorage.setItem("walletDialog", "use");
  } else {
    localStorage.setItem("walletDialog", "don'tUse");
  }
}

export function finalAddress(address: string) {
  return useInAppWallet() ? retrieveInAppAccount()[0] : address;
}

export function finalAddressAndSignFunction(
  address: string,
  signAndSubmit: SignAndSubmitTransaction,
) {
  return useInAppWallet() ? retrieveInAppAccount() : ([address, signAndSubmit] as const);
}
