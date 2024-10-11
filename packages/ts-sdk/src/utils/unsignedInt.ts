export function hexStringToUint8Array(rawString: string) {
  const s = rawString[1] === "x" ? rawString.slice(2) : rawString;
  const res = new Uint8Array(s.length / 2);
  for (let i = 0; i < s.length; i += 2) {
    res[i / 2] = Number.parseInt(s[i]!, 16) * 16 + Number.parseInt(s[i + 1]!, 16);
  }
  return res;
}
