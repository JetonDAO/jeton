declare module "ffjavascript" {
  export type Scalar = {
    isZero(e: bigint): boolean;
    isOdd(e: bigint): boolean;

    bitLength(e: bigint): number;
    bits(e: bigint): number[];
    shiftRight(e: bigint, n: number): bigint;
  };
  export const Scalar: Scalar;

  export type FrElement = Record<string, never>;
  export type Fr = {
    zero: FrElement;
    one: FrElement;

    e(v: bigint | string | number | FrElement): FrElement;
    toObject(e: FrElement): bigint;
    toString(e: FrElement): string;

    isZero(e: FrElement): boolean;
    eq(a: FrElement, b: FrElement): boolean;

    random(): FrElement;
    neg(e: FrElement): FrElement;
    square(e: FrElement): FrElement;
    add(a: FrElement, b: FrElement): FrElement;
    sub(a: FrElement, b: FrElement): FrElement;
    mul(a: FrElement, b: FrElement): FrElement;
    div(a: FrElement, b: FrElement): FrElement;
  };

  export type G1Element = Record<string, never>;
  export type G1 = {
    fromObject(point: bigint[]): G1Element;
    toObject(point: G1Element): bigint[];
    toRprUncompressed(buff: Uint8Array, offset: number, point: G1Element);
    fromRprUncompressed(point: Uint8Array, offset?: number): G1Element;
  };

  export type G2Element = Record<string, never>;
  export type G2 = {
    fromObject(point: bigint[][]): G1Element;
    toObject(point: G2Element): bigint[][];
    toRprUncompressed(buff: Uint8Array, offset: number, point: G2Element): void;
    fromRprUncompressed(point: Uint8Array, offset?: number): G2Element;
  };

  export type Bls12381 = {
    Fr: Fr;
    G1: G1;
    G2: G2;
  };
  export function buildBls12381(singleThread: boolean): Promise<Curve>;
}
