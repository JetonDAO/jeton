export async function getUrlBytes(
  url: string,
  onProgress?: (received: number, total: number) => void,
): Promise<Uint8Array> {
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
    onProgress?.(lastByte, length);
  }
  reader.releaseLock();
  return buffer;
}

export async function readData(url: string) {
  const response = await fetch(url);
  if (response.status !== 200) {
    throw new Error(
      `could not get wasm file from ${url}, response status is ${response.statusText}`,
    );
  }
  if (!response.body) throw new Error(`could not get wasm file form ${url}, response has no body`);

  const reader = response.body.getReader();

  let length = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
    length += value.length;
  }
  let lastByte = 0;
  const buffer = new Uint8Array(length);
  for (const chunk of chunks) {
    buffer.set(chunk, lastByte);
    lastByte += chunk.length;
  }
  return buffer;
}
