pragma circom 2.0.0;

include "../../../../node_modules/circomlib/circuits/montgomery.circom";
include "./add_montgomery_curve_points.circom";
include "./double_montgomery_curve_point.circom";
include "./add_twisted_edwards_curve_points.circom";

template SelectPoint() {
    signal input bit;
    signal input inputPoints[2][2];
    signal output outputPoint[2];

    outputPoint[0] <== (inputPoints[1][0] - inputPoints[0][0]) * bit + inputPoints[0][0];
    outputPoint[1] <== (inputPoints[1][1] - inputPoints[0][1]) * bit + inputPoints[0][1];
}

template MultiplyScalarTwistedEdwardsCurvePointSegment(edwardsA, edwardsD) {
    signal input bit;
    signal input doubleInputPoint[2];
    signal input addInputPoint[2];
    signal output doubleOutputPoint[2];
    signal output addOutputPoint[2];

    component doublePoint = DoubleMontgomeryCurvePoint(edwardsA, edwardsD);
    doublePoint.inputPoint[0] <== doubleInputPoint[0];
    doublePoint.inputPoint[1] <== doubleInputPoint[1];

    component addPoints = AddMontgomeryCurvePoints(edwardsA, edwardsD);
    addPoints.inputPoints[0][0] <== doublePoint.outputPoint[0];
    addPoints.inputPoints[0][1] <== doublePoint.outputPoint[1];
    addPoints.inputPoints[1][0] <== addInputPoint[0];
    addPoints.inputPoints[1][1] <== addInputPoint[1];

    component selectPoint = SelectPoint();
    selectPoint.bit <== bit;
    selectPoint.inputPoints[0][0] <== addInputPoint[0];
    selectPoint.inputPoints[0][1] <== addInputPoint[1];
    selectPoint.inputPoints[1][0] <== addPoints.outputPoint[0];
    selectPoint.inputPoints[1][1] <== addPoints.outputPoint[1];

    doubleOutputPoint[0] <== doublePoint.outputPoint[0];
    doubleOutputPoint[1] <== doublePoint.outputPoint[1];
    addOutputPoint[0] <== selectPoint.outputPoint[0];
    addOutputPoint[1] <== selectPoint.outputPoint[1];
}

template MultiplyScalarTwistedEdwardsCurvePoint(numBits, edwardsA, edwardsD) {
    signal input scalarBits[numBits];
    signal input inputPoint[2];
    signal output outputPoint[2];

    for (var i = 0; i < numBits; i++) {
        scalarBits[i] * (scalarBits[i] - 1) === 0;
    }

    component montgomeryPoint = Edwards2Montgomery();
    montgomeryPoint.in[0] <== inputPoint[0];
    montgomeryPoint.in[1] <== inputPoint[1];

    component segments[numBits - 1];
    segments[0] = MultiplyScalarTwistedEdwardsCurvePointSegment(edwardsA, edwardsD);
    segments[0].bit <== scalarBits[1];
    segments[0].doubleInputPoint[0] <== montgomeryPoint.out[0];
    segments[0].doubleInputPoint[1] <== montgomeryPoint.out[1];
    segments[0].addInputPoint[0] <== montgomeryPoint.out[0];
    segments[0].addInputPoint[1] <== montgomeryPoint.out[1];
    for (var i = 1; i < numBits - 1; i++) {
        segments[i] = MultiplyScalarTwistedEdwardsCurvePointSegment(edwardsA, edwardsD);
        segments[i].bit <== scalarBits[i + 1];
        segments[i].doubleInputPoint[0] <== segments[i - 1].doubleOutputPoint[0];
        segments[i].doubleInputPoint[1] <== segments[i - 1].doubleOutputPoint[1];
        segments[i].addInputPoint[0] <== segments[i - 1].addOutputPoint[0];
        segments[i].addInputPoint[1] <== segments[i - 1].addOutputPoint[1];
    }

    component edwardsPoint = Montgomery2Edwards();
    edwardsPoint.in[0] <== segments[numBits - 2].addOutputPoint[0];
    edwardsPoint.in[1] <== segments[numBits - 2].addOutputPoint[1];

    component firstAddPoint = AddTwistedEdwardsCurvePoints(edwardsA, edwardsD);
    firstAddPoint.inputPoints[0][0] <== edwardsPoint.out[0];
    firstAddPoint.inputPoints[0][1] <== edwardsPoint.out[1];
    firstAddPoint.inputPoints[1][0] <== -1 * inputPoint[0];
    firstAddPoint.inputPoints[1][1] <== inputPoint[1];

    component firstSelectPoint = SelectPoint();
    firstSelectPoint.bit <== scalarBits[0];
    firstSelectPoint.inputPoints[0][0] <== firstAddPoint.outputPoint[0];
    firstSelectPoint.inputPoints[0][1] <== firstAddPoint.outputPoint[1];
    firstSelectPoint.inputPoints[1][0] <== edwardsPoint.out[0];
    firstSelectPoint.inputPoints[1][1] <== edwardsPoint.out[1];

    outputPoint[0] <== firstSelectPoint.outputPoint[0];
    outputPoint[1] <== firstSelectPoint.outputPoint[1];
}