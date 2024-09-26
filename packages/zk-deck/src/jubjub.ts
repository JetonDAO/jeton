import { type Fr, type FrElement, Scalar } from "ffjavascript";

export type Point = [FrElement, FrElement];

export class JubJub {
  readonly edwardsA: FrElement;
  readonly edwardsD: FrElement;
  readonly order: bigint;
  readonly generator: Point;
  readonly zero: Point;
  constructor(readonly field: Fr) {
    this.edwardsA =
      field.e(
        52435875175126190479447740508185965837690552500527637822603658699938581184512n,
      );
    this.edwardsD =
      field.e(
        19257038036680949359750312669786877991949435402254120286184196891950884077233n,
      );
    this.order =
      6554484396890773809930967563523245729705921265872317281365359162392183254199n;
    this.generator = [
      field.e(
        8076246640662884909881801758704306714034609987455869804520522091855516602923n,
      ),
      field.e(
        13262374693698910701929044844600465831413122818447359594527400194675274060458n,
      ),
    ];
    this.zero = [field.e(0), field.e(1)];
  }

  public sampleScalar(): bigint {
    const numBits = Scalar.bitLength(this.order);
    const buffer = new Uint8Array(Math.ceil(numBits / 8));
    let sample: bigint;
    do {
      crypto.getRandomValues(buffer);
      sample = buffer.reduce((acc, byte) => acc * 256n + BigInt(byte), 0n);
    } while (sample >= this.order);
    return sample;
  }

  public toStringTuple(point: Point): [string, string] {
    return [this.field.toString(point[0]), this.field.toString(point[1])];
  }

  public fromStringTuple([x, y]: [string, string]): Point {
    return [this.field.e(x), this.field.e(y)];
  }

  public serialize(buf: Uint8Array, offset: number, point: Point) {
    const dataVeiw = new DataView(buf.buffer, offset, 64);
    for (let i = 0; i < 2; i++) {
      let n = this.field.toObject(point[i] as FrElement);
      dataVeiw.setBigInt64((i * 4 + 3) * 8, n);
      for (let j = 2; j >= 0; j--) {
        n /= 2n ** 64n;
        dataVeiw.setBigInt64((i * 4 + j) * 8, n);
      }
    }
  }

  public deserialize(buf: Uint8Array, offset: number): Point {
    const dataVeiw = new DataView(buf.buffer, offset, 64);
    const point: Point = [this.field.e(0), this.field.e(0)];
    for (let i = 0; i < 2; i++) {
      let n = dataVeiw.getBigUint64(i * 4 * 8);
      for (let j = 1; j < 4; j++) {
        n *= 2n ** 64n;
        n += dataVeiw.getBigUint64((i * 4 + j) * 8);
      }
      point[i] = this.field.e(n);
    }
    return point;
  }

  public inCurve(p: Point): boolean {
    const f = this.field;
    const x2 = f.square(p[0]);
    const y2 = f.square(p[1]);
    const left = f.add(f.mul(this.edwardsA, x2), y2);
    const right = f.add(f.one, f.mul(f.mul(x2, y2), this.edwardsD));
    return f.eq(left, right);
  }

  public eqPoints(p1: Point, p2: Point): boolean {
    return this.field.eq(p1[0], p2[0]) && this.field.eq(p1[1], p2[1]);
  }

  public negPoint(p: Point): Point {
    return [this.field.neg(p[0]), p[1]];
  }

  public addPoints(a: Point, b: Point): Point {
    const f = this.field;
    const beta = f.mul(a[0], b[1]);
    const gamma = f.mul(a[1], b[0]);
    const delta = f.mul(
      f.sub(a[1], f.mul(this.edwardsA, a[0])),
      f.add(b[0], b[1]),
    );
    const tau = f.mul(beta, gamma);
    const dtau = f.mul(this.edwardsD, tau);

    const x = f.div(f.add(beta, gamma), f.add(f.one, dtau));
    const y = f.div(
      f.add(delta, f.sub(f.mul(this.edwardsA, beta), gamma)),
      f.sub(f.one, dtau),
    );
    return [x, y];
  }

  public mulScalarPoint(s: string | bigint | number, p: Point): Point {
    const f = this.field;
    let acc: Point = this.zero;
    let rem = BigInt(s);
    let exp: Point = p;
    while (!Scalar.isZero(rem)) {
      if (Scalar.isOdd(rem)) {
        acc = this.addPoints(acc, exp);
      }
      exp = this.addPoints(exp, exp);
      rem = Scalar.shiftRight(rem, 1);
    }
    return acc;
  }
}
