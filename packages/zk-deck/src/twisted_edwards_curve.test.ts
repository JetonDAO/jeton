import { expect } from "chai";
import { before, describe, test } from "mocha";

import {
  type TwistedEdwardsCurve,
  createBabyJubJub,
} from "./twisted_edwards_curve.js";

describe("TwistedEdwardsCurve", () => {
  let curve: TwistedEdwardsCurve;
  before(async () => {
    curve = await createBabyJubJub();
  });

  test("ap should be in curve", () => {
    const a = curve.sampleScalar();
    const p = curve.mulScalarPoint(curve.sampleScalar(), curve.generator);

    const ap = curve.mulScalarPoint(a, p);
    expect(curve.inCurve(ap)).to.be.true;
  });

  test("p + q should be in curve", () => {
    const p = curve.mulScalarPoint(curve.sampleScalar(), curve.generator);
    const q = curve.mulScalarPoint(curve.sampleScalar(), curve.generator);

    const s = curve.addPoints(p, q);
    expect(curve.inCurve(s)).to.be.true;
  });

  test("p = p", () => {
    const p = curve.mulScalarPoint(curve.sampleScalar(), curve.generator);

    expect(curve.eqPoints(p, p)).to.be.true;
  });

  test("p + q = q + p", () => {
    const p = curve.mulScalarPoint(curve.sampleScalar(), curve.generator);
    const q = curve.mulScalarPoint(curve.sampleScalar(), curve.generator);

    const left = curve.addPoints(p, q);
    const right = curve.addPoints(q, p);
    expect(curve.inCurve(left)).to.be.true;
    expect(curve.inCurve(right)).to.be.true;
    expect(curve.eqPoints(left, right)).to.be.true;
  });

  test("0 * p = 1", () => {
    const p = curve.mulScalarPoint(curve.sampleScalar(), curve.generator);

    const left = curve.mulScalarPoint(0, p);
    expect(curve.inCurve(left)).to.be.true;
    expect(curve.eqPoints(left, curve.zero)).to.be.true;
  });

  test("p + p = 2 * p", () => {
    const p = curve.mulScalarPoint(curve.sampleScalar(), curve.generator);

    const left = curve.addPoints(p, p);
    const right = curve.mulScalarPoint(2, p);
    expect(curve.inCurve(left)).to.be.true;
    expect(curve.inCurve(right)).to.be.true;
    expect(curve.eqPoints(left, right)).to.be.true;
  });

  test("p + p + p = 3 * p", () => {
    const p = curve.mulScalarPoint(curve.sampleScalar(), curve.generator);

    const left = curve.addPoints(curve.addPoints(p, p), p);
    const right = curve.mulScalarPoint(3, p);
    expect(curve.inCurve(left)).to.be.true;
    expect(curve.inCurve(right)).to.be.true;
    expect(curve.eqPoints(left, right)).to.be.true;
  });

  test("a * (p + q) = a * p + a * q", () => {
    const a = curve.sampleScalar();
    const p = curve.mulScalarPoint(curve.sampleScalar(), curve.generator);
    const q = curve.mulScalarPoint(curve.sampleScalar(), curve.generator);

    const left = curve.mulScalarPoint(a, curve.addPoints(p, q));
    const right = curve.addPoints(
      curve.mulScalarPoint(a, p),
      curve.mulScalarPoint(a, q),
    );
    expect(curve.inCurve(left)).to.be.true;
    expect(curve.inCurve(right)).to.be.true;
    expect(curve.eqPoints(left, right)).to.be.true;
  });

  test("(a + b) * p = a * p + b * p", () => {
    const a = curve.sampleScalar();
    const b = curve.sampleScalar();
    const p = curve.mulScalarPoint(curve.sampleScalar(), curve.generator);

    const left = curve.mulScalarPoint((a + b) % curve.order, p);
    const right = curve.addPoints(
      curve.mulScalarPoint(a, p),
      curve.mulScalarPoint(b, p),
    );
    expect(curve.inCurve(left)).to.be.true;
    expect(curve.inCurve(right)).to.be.true;
    expect(curve.eqPoints(left, right)).to.be.true;
  });

  test("p + -p = 0", () => {
    const p = curve.mulScalarPoint(curve.sampleScalar(), curve.generator);

    const left = curve.addPoints(p, curve.negPoint(p));
    expect(curve.inCurve(left)).to.be.true;
    expect(curve.eqPoints(left, curve.zero)).to.be.true;
  });

  test("order * p = 0", () => {
    const p = curve.mulScalarPoint(curve.sampleScalar(), curve.generator);

    const left = curve.mulScalarPoint(curve.order, p);
    expect(curve.inCurve(left)).to.be.true;
    expect(curve.eqPoints(left, curve.zero)).to.be.true;
  });
});
