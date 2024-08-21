import { expect } from "chai";
import { before, describe, test } from "mocha";

import createBabyJubJub, { type BabyJubJub, type Point } from "./babyjubjub.js";

describe("babyJubJub", async () => {
  let bjj: BabyJubJub;
  before(async () => {
    bjj = await createBabyJubJub();
  });

  test("ap should be in curve", () => {
    const a = bjj.sampleScalar();
    const p: Point = bjj.mulScalarPoint(bjj.sampleScalar(), bjj.generator);

    const ap = bjj.mulScalarPoint(a, p);
    expect(bjj.inCurve(ap)).to.be.true;
  });

  test("p + q should be in curve", () => {
    const p: Point = bjj.mulScalarPoint(bjj.sampleScalar(), bjj.generator);
    const q: Point = bjj.mulScalarPoint(bjj.sampleScalar(), bjj.generator);

    const s = bjj.addPoints(p, q);
    expect(bjj.inCurve(s)).to.be.true;
  });

  test("p = p", () => {
    const p: Point = bjj.mulScalarPoint(bjj.sampleScalar(), bjj.generator);

    expect(bjj.eqPoints(p, p)).to.be.true;
  });

  test("p + q = q + p", () => {
    const p: Point = bjj.mulScalarPoint(bjj.sampleScalar(), bjj.generator);
    const q: Point = bjj.mulScalarPoint(bjj.sampleScalar(), bjj.generator);

    const left = bjj.addPoints(p, q);
    const right = bjj.addPoints(q, p);
    expect(bjj.inCurve(left)).to.be.true;
    expect(bjj.inCurve(right)).to.be.true;
    expect(bjj.eqPoints(left, right)).to.be.true;
  });

  test("0 * p = 1", () => {
    const p: Point = bjj.mulScalarPoint(bjj.sampleScalar(), bjj.generator);

    const left = bjj.mulScalarPoint(0, p);
    const right: Point = [bjj.element(0), bjj.element(1)];
    expect(bjj.inCurve(left)).to.be.true;
    expect(bjj.inCurve(right)).to.be.true;
    expect(bjj.eqPoints(left, right)).to.be.true;
  });

  test("p + p = 2 * p", () => {
    const p: Point = bjj.mulScalarPoint(bjj.sampleScalar(), bjj.generator);

    const left = bjj.addPoints(p, p);
    const right = bjj.mulScalarPoint(2, p);
    expect(bjj.inCurve(left)).to.be.true;
    expect(bjj.inCurve(right)).to.be.true;
    expect(bjj.eqPoints(left, right)).to.be.true;
  });

  test("p + p + p = 3 * p", () => {
    const p: Point = bjj.mulScalarPoint(bjj.sampleScalar(), bjj.generator);

    const left = bjj.addPoints(bjj.addPoints(p, p), p);
    const right = bjj.mulScalarPoint(3, p);
    expect(bjj.inCurve(left)).to.be.true;
    expect(bjj.inCurve(right)).to.be.true;
    expect(bjj.eqPoints(left, right)).to.be.true;
  });

  test("a * (p + q) = a * p + a * q", () => {
    const a = bjj.sampleScalar();
    const p: Point = bjj.mulScalarPoint(bjj.sampleScalar(), bjj.generator);
    const q: Point = bjj.mulScalarPoint(bjj.sampleScalar(), bjj.generator);

    const left = bjj.mulScalarPoint(a, bjj.addPoints(p, q));
    const right = bjj.addPoints(
      bjj.mulScalarPoint(a, p),
      bjj.mulScalarPoint(a, q),
    );
    expect(bjj.inCurve(left)).to.be.true;
    expect(bjj.inCurve(right)).to.be.true;
    expect(bjj.eqPoints(left, right)).to.be.true;
  });

  test("(a + b) * p = a * p + b * p", () => {
    const a = bjj.sampleScalar();
    const b = bjj.sampleScalar();
    const p: Point = bjj.mulScalarPoint(bjj.sampleScalar(), bjj.generator);

    const left = bjj.mulScalarPoint(a + b, p);
    const right = bjj.addPoints(
      bjj.mulScalarPoint(a, p),
      bjj.mulScalarPoint(b, p),
    );
    expect(bjj.inCurve(left)).to.be.true;
    expect(bjj.inCurve(right)).to.be.true;
    expect(bjj.eqPoints(left, right)).to.be.true;
  });

  test("p + -p = 0", () => {
    const p: Point = bjj.mulScalarPoint(bjj.sampleScalar(), bjj.generator);

    const left = bjj.addPoints(p, bjj.negPoint(p));
    const right: Point = [bjj.element(0), bjj.element(1)];
    expect(bjj.inCurve(left)).to.be.true;
    expect(bjj.inCurve(right)).to.be.true;
    expect(bjj.eqPoints(left, right)).to.be.true;
  });
});
