const sumCallback = (total: number, val: number) => total + val;

export function calculatePercentage(received: number[], total: number[]) {
  const p = Math.floor((received.reduce(sumCallback, 0) / total.reduce(sumCallback, 0)) * 100);
  return p;
}
