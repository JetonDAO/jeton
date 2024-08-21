import {
  type Field,
  type FieldElement,
  Scalar,
  getCurveFromName,
} from "ffjavascript";

export type Point = [FieldElement, FieldElement];

export class BabyJubJub {
  readonly field: Field;
  readonly generator: Point;
  readonly edwardsA: FieldElement;
  readonly edwardsD: FieldElement;

  constructor(field: Field) {
    this.field = field;
    this.edwardsA = this.element("168700");
    this.edwardsD = this.element("168696");
    this.generator = [
      this.element(
        "5299619240641551281634865583518297030282874472190772894086521144482721001553",
      ),
      this.element(
        "16950150798460657717958625567821834550301663161624707787222815936182638968203",
      ),
    ];
  }

  public element(v: string | bigint | number | FieldElement): FieldElement {
    return this.field.e(v);
  }

  public elementToString(e: FieldElement): string {
    return this.field.toString(e);
  }

  public sampleScalar(): bigint {
    return this.field.toObject(this.field.random());
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
    let acc: Point = [this.element("0"), this.element("1")];
    let rem = Scalar.e(s);
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

export default async function createBabyJubJub(): Promise<BabyJubJub> {
  const curve = await getCurveFromName("bn128", true);
  return new BabyJubJub(curve.Fr);
}
