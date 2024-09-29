import { createZKDeck } from "@jeton/zk-deck";
import { calculatePercentage } from "./calculatePercentage";
import { getUrlBytes, readData } from "./getURLBytes";

export type ZkDeckUrls = {
  shuffleEncryptDeckWasm: string;
  decryptCardShareWasm: string;
  shuffleEncryptDeckZkey: string;
  decryptCardShareZkey: string;
};

export const createLocalZKDeck = async (
  filesOrUrls: ZkDeckUrls,
  callback?: (data: { percentage: number }) => void,
) => {
  const [
    decryptCardShareZkeyBytes,
    shuffleEncryptDeckZkeyBytes,
    decryptCardShareWasmBytes,
    shuffleEncryptDeckWasmBytes,
  ] = await downloadZkeyFiles(filesOrUrls);

  const zkDeck = await createZKDeck(
    shuffleEncryptDeckWasmBytes,
    decryptCardShareWasmBytes,
    shuffleEncryptDeckZkeyBytes,
    decryptCardShareZkeyBytes,
  );
  return zkDeck;
};

const downloadZkeyFiles = async (
  urls: ZkDeckUrls,
  callback?: (data: { percentage: number }) => void,
) => {
  let decryptCardShareReceived = 0;
  let decryptCardShareTotal: number;

  let shuffleEncryptReceived = 0;
  let shuffleEncryptTotal: number;

  const [
    decryptCardShareZkeyBytes,
    shuffleEncryptDeckZkeyBytes,
    decryptCardShareWasmBytes,
    shuffleEncryptDeckWasmBytes,
  ] = await Promise.all([
    getUrlBytes(urls.decryptCardShareZkey, (received, total) => {
      decryptCardShareReceived = received;
      decryptCardShareTotal = total;
      if (decryptCardShareTotal && shuffleEncryptTotal)
        callback?.({
          percentage: calculatePercentage(
            [decryptCardShareReceived, shuffleEncryptReceived],
            [decryptCardShareTotal, shuffleEncryptTotal],
          ),
        });
    }),
    getUrlBytes(urls.shuffleEncryptDeckZkey, (received, total) => {
      shuffleEncryptReceived = received;
      shuffleEncryptTotal = total;
      if (decryptCardShareTotal && shuffleEncryptTotal)
        callback?.({
          percentage: calculatePercentage(
            [decryptCardShareReceived, shuffleEncryptReceived],
            [decryptCardShareTotal, shuffleEncryptTotal],
          ),
        });
    }),
    readData(urls.decryptCardShareWasm),
    readData(urls.shuffleEncryptDeckWasm),
  ]);
  return [
    decryptCardShareZkeyBytes,
    shuffleEncryptDeckZkeyBytes,
    decryptCardShareWasmBytes,
    shuffleEncryptDeckWasmBytes,
  ] as const;
};
