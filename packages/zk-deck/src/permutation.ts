export function samplePermutationVector(n: number): number[] {
  const permutationVector = Array.from(new Array(n).keys());
  for (let i = permutationVector.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [permutationVector[i], permutationVector[j]] = [
      permutationVector[j] as number,
      permutationVector[i] as number,
    ];
  }
  return permutationVector;
}

export function applyPermutationVector<T>(permutationVector: number[], inputVector: T[]): T[] {
  return permutationVector.map((i) => inputVector[i] as T);
}

export function createPermutationMatrix(permutationVector: number[]): number[][] {
  const n = permutationVector.length;
  return permutationVector.map((index) => {
    const row = new Array(n).fill(0);
    row[index] = 1;
    return row;
  });
}
