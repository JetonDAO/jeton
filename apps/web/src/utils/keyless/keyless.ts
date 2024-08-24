import { KeylessAccount } from "@aptos-labs/ts-sdk";

export const storeKeylessAccount = (account: KeylessAccount): void =>
  localStorage.setItem("@aptos/account", encodeKeylessAccount(account));

export const encodeKeylessAccount = (account: KeylessAccount): string =>
  JSON.stringify(account, (_, e) => {
    if (typeof e === "bigint") return { __type: "bigint", value: e.toString() };
    if (e instanceof Uint8Array)
      return { __type: "Uint8Array", value: Array.from(e) };
    if (e instanceof KeylessAccount)
      return { __type: "KeylessAccount", data: e.bcsToBytes() };
    return e;
  });

export const getLocalKeylessAccount = (): KeylessAccount | undefined => {
  try {
    const encodedAccount = localStorage.getItem("@aptos/account");
    return encodedAccount ? decodeKeylessAccount(encodedAccount) : undefined;
  } catch (error) {
    console.warn("Failed to decode account from localStorage", error);
    return undefined;
  }
};

export const decodeKeylessAccount = (encodedAccount: string): KeylessAccount =>
  JSON.parse(encodedAccount, (_, e) => {
    if (e && e.__type === "bigint") return BigInt(e.value);
    if (e && e.__type === "Uint8Array") return new Uint8Array(e.value);
    if (e && e.__type === "KeylessAccount")
      return KeylessAccount.fromBytes(e.data);
    return e;
  });
