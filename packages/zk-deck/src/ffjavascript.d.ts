declare module "ffjavascript" {
  export type Scalar = {
    isZero(e: bigint): boolean;
    isOdd(e: bigint): boolean;

    bitLength(e: bigint): number;
    bits(e: bigint): number[];
    shiftRight(e: bigint, n: number): bigint;
  };
  export const Scalar: Scalar;

  export type FieldElement = Record<string, never>;
  export type Field = {
    zero: FieldElement;
    one: FieldElement;

    e(v: bigint | string | number | FieldElement): FieldElement;
    toObject(e: FieldElement): bigint;
    toString(e: FieldElement): string;

    isZero(e: FieldElement): boolean;
    eq(a: FieldElement, b: FieldElement): boolean;

    random(): FieldElement;
    neg(e: FieldElement): FieldElement;
    square(e: FieldElement): FieldElement;
    add(a: FieldElement, b: FieldElement): FieldElement;
    sub(a: FieldElement, b: FieldElement): FieldElement;
    mul(a: FieldElement, b: FieldElement): FieldElement;
    div(a: FieldElement, b: FieldElement): FieldElement;
  };

  export type Curve = {
    Fr: Field;
    terminate(): Promise<void>;
  };
  export function getCurveFromName(name: string, flag: boolean): Promise<Curve>;
}
