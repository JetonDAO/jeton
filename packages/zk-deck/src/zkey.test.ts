import { decryptCardShareZkeyURL, shuffleEncryptDeckZkeyURL } from "./constants.js";

async function getUrlBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (response.status !== 200) {
    throw new Error(
      `could not get zkey file from ${url}, response status is ${response.statusText}`,
    );
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength === null) {
    throw new Error(`could not get zkey file from ${url}, content-length is null`);
  }
  const length = Number.parseInt(contentLength);

  if (response.body === null) {
    throw new Error(`could not get zkey file from ${url}, body is null`);
  }
  const reader = response.body.getReader();

  const buffer = new Uint8Array(length);
  let lastByte = 0;
  while (lastByte < buffer.length) {
    const { done, value } = await reader.read();
    if (done) {
      throw new Error(`could not get zkey file from ${url}, early EoF`);
    }
    if (value === undefined) {
      throw new Error(`could not get zkey file from ${url}, value is undefined`);
    }
    buffer.set(value, lastByte);
    lastByte += value.length;
  }
  await reader.releaseLock();
  return buffer;
}

export const decryptCardShareZkey = await getUrlBytes(decryptCardShareZkeyURL);
export const shuffleEncryptDeckZkey = await getUrlBytes(shuffleEncryptDeckZkeyURL);
