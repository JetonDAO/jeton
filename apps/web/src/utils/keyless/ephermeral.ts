import { EphemeralKeyPair } from "@aptos-labs/ts-sdk";

/**
 * Store the ephemeral key pair in localStorage.
 */
export const storeEphemeralKeyPair = (ekp: EphemeralKeyPair): void =>
  localStorage.setItem("@aptos/ekp", encodeEphemeralKeyPair(ekp));

/**
 * Retrieve the ephemeral key pair from localStorage if it exists.
 */
export const getLocalEphemeralKeyPair = (): EphemeralKeyPair | undefined => {
  try {
    const encodedEkp = localStorage.getItem("@aptos/ekp");
    return encodedEkp ? decodeEphemeralKeyPair(encodedEkp) : undefined;
  } catch (error) {
    console.warn(
      "Failed to decode ephemeral key pair from localStorage",
      error,
    );
    return undefined;
  }
};

/**
 * Stringify the ephemeral key pairs to be stored in localStorage
 */
export const encodeEphemeralKeyPair = (ekp: EphemeralKeyPair): string =>
  JSON.stringify(ekp, (_, e) => {
    if (typeof e === "bigint") return { __type: "bigint", value: e.toString() };
    if (e instanceof Uint8Array)
      return { __type: "Uint8Array", value: Array.from(e) };
    if (e instanceof EphemeralKeyPair)
      return { __type: "EphemeralKeyPair", data: e.bcsToBytes() };
    return e;
  });

/**
 * Parse the ephemeral key pairs from a string
 */
export const decodeEphemeralKeyPair = (encodedEkp: string): EphemeralKeyPair =>
  JSON.parse(encodedEkp, (_, e) => {
    if (e && e.__type === "bigint") return BigInt(e.value);
    if (e && e.__type === "Uint8Array") return new Uint8Array(e.value);
    if (e && e.__type === "EphemeralKeyPair")
      return EphemeralKeyPair.fromBytes(e.data);
    return e;
  });
