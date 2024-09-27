import { expect } from "chai";
import { before, describe, test } from "mocha";

import { buildBls12381 } from "ffjavascript";

import { JubJub } from "./jubjub.js";

describe("jubjub", () => {
  let jubjub: JubJub;
  before(async () => {
    const bls12381 = await buildBls12381(true);
    jubjub = new JubJub(bls12381.Fr);
  });

  test("ap should be in jubjub", () => {
    const a = jubjub.sampleScalar();
    const p = jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator);

    const ap = jubjub.mulScalarPoint(a, p);
    expect(jubjub.inCurve(ap)).to.be.true;
  });

  test("p + q should be in curve", () => {
    const p = jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator);
    const q = jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator);

    const s = jubjub.addPoints(p, q);
    expect(jubjub.inCurve(s)).to.be.true;
  });

  test("p = p", () => {
    const p = jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator);

    expect(jubjub.eqPoints(p, p)).to.be.true;
  });

  test("p + q = q + p", () => {
    const p = jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator);
    const q = jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator);

    const left = jubjub.addPoints(p, q);
    const right = jubjub.addPoints(q, p);
    expect(jubjub.inCurve(left)).to.be.true;
    expect(jubjub.inCurve(right)).to.be.true;
    expect(jubjub.eqPoints(left, right)).to.be.true;
  });

  test("0 * p = 1", () => {
    const p = jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator);

    const left = jubjub.mulScalarPoint(0, p);
    expect(jubjub.inCurve(left)).to.be.true;
    expect(jubjub.eqPoints(left, jubjub.zero)).to.be.true;
  });

  test("p + p = 2 * p", () => {
    const p = jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator);

    const left = jubjub.addPoints(p, p);
    const right = jubjub.mulScalarPoint(2, p);
    expect(jubjub.inCurve(left)).to.be.true;
    expect(jubjub.inCurve(right)).to.be.true;
    expect(jubjub.eqPoints(left, right)).to.be.true;
  });

  test("p + p + p = 3 * p", () => {
    const p = jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator);

    const left = jubjub.addPoints(jubjub.addPoints(p, p), p);
    const right = jubjub.mulScalarPoint(3, p);
    expect(jubjub.inCurve(left)).to.be.true;
    expect(jubjub.inCurve(right)).to.be.true;
    expect(jubjub.eqPoints(left, right)).to.be.true;
  });

  test("a * (p + q) = a * p + a * q", () => {
    const a = jubjub.sampleScalar();
    const p = jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator);
    const q = jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator);

    const left = jubjub.mulScalarPoint(a, jubjub.addPoints(p, q));
    const right = jubjub.addPoints(jubjub.mulScalarPoint(a, p), jubjub.mulScalarPoint(a, q));
    expect(jubjub.inCurve(left)).to.be.true;
    expect(jubjub.inCurve(right)).to.be.true;
    expect(jubjub.eqPoints(left, right)).to.be.true;
  });

  test("(a + b) * p = a * p + b * p", () => {
    const a = jubjub.sampleScalar();
    const b = jubjub.sampleScalar();
    const p = jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator);

    const left = jubjub.mulScalarPoint((a + b) % jubjub.order, p);
    const right = jubjub.addPoints(jubjub.mulScalarPoint(a, p), jubjub.mulScalarPoint(b, p));
    expect(jubjub.inCurve(left)).to.be.true;
    expect(jubjub.inCurve(right)).to.be.true;
    expect(jubjub.eqPoints(left, right)).to.be.true;
  });

  test("p + -p = 0", () => {
    const p = jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator);

    const left = jubjub.addPoints(p, jubjub.negPoint(p));
    expect(jubjub.inCurve(left)).to.be.true;
    expect(jubjub.eqPoints(left, jubjub.zero)).to.be.true;
  });

  test("order * p = 0", () => {
    const p = jubjub.mulScalarPoint(jubjub.sampleScalar(), jubjub.generator);

    const left = jubjub.mulScalarPoint(jubjub.order, p);
    expect(jubjub.inCurve(left)).to.be.true;
    expect(jubjub.eqPoints(left, jubjub.zero)).to.be.true;
  });
});
