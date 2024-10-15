pragma circom 2.0.0;

include "../../../../node_modules/circomlib/circuits/mux3.circom";
include "../../../../node_modules/circomlib/circuits/montgomery.circom";
include "./add_montgomery_curve_points.circom";
include "./double_montgomery_curve_point.circom";
include "./add_twisted_edwards_curve_points.circom";

template MultiplyScalarTwistedEdwardsCurveFixPointSegment(edwardsA, edwardsD) {
    signal input scalarBits[3];
    signal input inputPoint[2];
    signal output outputPoint[2];
    signal output eightPoint[2];

    component mux = MultiMux3(2);
    mux.s[0] <== scalarBits[0];
    mux.s[1] <== scalarBits[1];
    mux.s[2] <== scalarBits[2];

    mux.c[0][0] <== inputPoint[0];
    mux.c[1][0] <== inputPoint[1];

    component two = DoubleMontgomeryCurvePoint(edwardsA, edwardsD);
    two.inputPoint[0] <== inputPoint[0];
    two.inputPoint[1] <== inputPoint[1];
    mux.c[0][1] <== two.outputPoint[0];
    mux.c[1][1] <== two.outputPoint[1];

    component three = AddMontgomeryCurvePoints(edwardsA, edwardsD);
    three.inputPoints[0][0] <== two.outputPoint[0];
    three.inputPoints[0][1] <== two.outputPoint[1];
    three.inputPoints[1][0] <== inputPoint[0];
    three.inputPoints[1][1] <== inputPoint[1];
    mux.c[0][2] <== three.outputPoint[0];
    mux.c[1][2] <== three.outputPoint[1];

    component four = AddMontgomeryCurvePoints(edwardsA, edwardsD);
    four.inputPoints[0][0] <== three.outputPoint[0];
    four.inputPoints[0][1] <== three.outputPoint[1];
    four.inputPoints[1][0] <== inputPoint[0];
    four.inputPoints[1][1] <== inputPoint[1];
    mux.c[0][3] <== four.outputPoint[0];
    mux.c[1][3] <== four.outputPoint[1];

    component five = AddMontgomeryCurvePoints(edwardsA, edwardsD);
    five.inputPoints[0][0] <== four.outputPoint[0];
    five.inputPoints[0][1] <== four.outputPoint[1];
    five.inputPoints[1][0] <== inputPoint[0];
    five.inputPoints[1][1] <== inputPoint[1];
    mux.c[0][4] <== five.outputPoint[0];
    mux.c[1][4] <== five.outputPoint[1];

    component six = AddMontgomeryCurvePoints(edwardsA, edwardsD);
    six.inputPoints[0][0] <== five.outputPoint[0];
    six.inputPoints[0][1] <== five.outputPoint[1];
    six.inputPoints[1][0] <== inputPoint[0];
    six.inputPoints[1][1] <== inputPoint[1];
    mux.c[0][5] <== six.outputPoint[0];
    mux.c[1][5] <== six.outputPoint[1];

    component seven = AddMontgomeryCurvePoints(edwardsA, edwardsD);
    seven.inputPoints[0][0] <== six.outputPoint[0];
    seven.inputPoints[0][1] <== six.outputPoint[1];
    seven.inputPoints[1][0] <== inputPoint[0];
    seven.inputPoints[1][1] <== inputPoint[1];
    mux.c[0][6] <== seven.outputPoint[0];
    mux.c[1][6] <== seven.outputPoint[1];

    component eight = AddMontgomeryCurvePoints(edwardsA, edwardsD);
    eight.inputPoints[0][0] <== seven.outputPoint[0];
    eight.inputPoints[0][1] <== seven.outputPoint[1];
    eight.inputPoints[1][0] <== inputPoint[0];
    eight.inputPoints[1][1] <== inputPoint[1];
    mux.c[0][7] <== eight.outputPoint[0];
    mux.c[1][7] <== eight.outputPoint[1];

    outputPoint[0] <== mux.out[0];
    outputPoint[1] <== mux.out[1];
    eightPoint[0] <== eight.outputPoint[0];
    eightPoint[1] <== eight.outputPoint[1];
}

template MultiplyScalarTwistedEdwardsCurveFixPoint(numTripleBits, edwardsA, edwardsD, basePoint) {
    var numBits = 3 * numTripleBits;

    signal input scalarBits[numBits];
    signal output outputPoint[2];

    for (var i = 0; i < numBits; i++) {
        scalarBits[i] * (scalarBits[i] - 1) === 0;
    }

    component montgomeryPoint = Edwards2Montgomery();
    montgomeryPoint.in[0] <== basePoint[0];
    montgomeryPoint.in[1] <== basePoint[1];

    component segments[numTripleBits];
    for (var i = 0; i < numTripleBits; i++) {
        segments[i] = MultiplyScalarTwistedEdwardsCurveFixPointSegment(edwardsA, edwardsD);
        segments[i].scalarBits[0] <== scalarBits[3 * i];
        segments[i].scalarBits[1] <== scalarBits[3 * i + 1];
        segments[i].scalarBits[2] <== scalarBits[3 * i + 2];
    }
    segments[0].inputPoint[0] <== montgomeryPoint.out[0];
    segments[0].inputPoint[1] <== montgomeryPoint.out[1];
    for (var i = 1; i < numTripleBits; i++) {
        segments[i].inputPoint[0] <== segments[i - 1].eightPoint[0];
        segments[i].inputPoint[1] <== segments[i - 1].eightPoint[1];
    }
    component doublePoint = DoubleMontgomeryCurvePoint(edwardsA, edwardsD);
    doublePoint.inputPoint[0] <== segments[numTripleBits - 1].eightPoint[0];
    doublePoint.inputPoint[1] <== segments[numTripleBits - 1].eightPoint[1];

    component addFirstPoints[numTripleBits];
    for (var i = 0; i < numTripleBits - 1; i++) {
        addFirstPoints[i] = AddMontgomeryCurvePoints(edwardsA, edwardsD);
        addFirstPoints[i].inputPoints[0][0] <== segments[i].eightPoint[0];
        addFirstPoints[i].inputPoints[0][1] <== segments[i].eightPoint[1];
    }
    addFirstPoints[numTripleBits - 1] = AddMontgomeryCurvePoints(edwardsA, edwardsD);
    addFirstPoints[numTripleBits - 1].inputPoints[0][0] <== doublePoint.outputPoint[0];
    addFirstPoints[numTripleBits - 1].inputPoints[0][1] <== doublePoint.outputPoint[1];
    addFirstPoints[0].inputPoints[1][0] <== montgomeryPoint.out[0];
    addFirstPoints[0].inputPoints[1][1] <== montgomeryPoint.out[1];
    for (var i = 1; i < numTripleBits; i++) {
        addFirstPoints[i].inputPoints[1][0] <== addFirstPoints[i - 1].outputPoint[0];
        addFirstPoints[i].inputPoints[1][1] <== addFirstPoints[i - 1].outputPoint[1];
    }
    component edwardsFirstPoint = Montgomery2Edwards();
    edwardsFirstPoint.in[0] <== addFirstPoints[numTripleBits - 1].outputPoint[0];
    edwardsFirstPoint.in[1] <== addFirstPoints[numTripleBits - 1].outputPoint[1];

    component addSecondPoints[numTripleBits];
    for (var i = 0; i < numTripleBits; i++) {
        addSecondPoints[i] = AddMontgomeryCurvePoints(edwardsA, edwardsD);
        addSecondPoints[i].inputPoints[0][0] <== segments[i].outputPoint[0];
        addSecondPoints[i].inputPoints[0][1] <== segments[i].outputPoint[1];
    }
    addSecondPoints[0].inputPoints[1][0] <== doublePoint.outputPoint[0];
    addSecondPoints[0].inputPoints[1][1] <== doublePoint.outputPoint[1];
    for (var i = 1; i < numTripleBits; i++) {
        addSecondPoints[i].inputPoints[1][0] <== addSecondPoints[i - 1].outputPoint[0];
        addSecondPoints[i].inputPoints[1][1] <== addSecondPoints[i - 1].outputPoint[1];
    }
    component edwardsSecondPoint = Montgomery2Edwards();
    edwardsSecondPoint.in[0] <== addSecondPoints[numTripleBits - 1].outputPoint[0];
    edwardsSecondPoint.in[1] <== addSecondPoints[numTripleBits - 1].outputPoint[1];

    component result = AddTwistedEdwardsCurvePoints(edwardsA, edwardsD);
    result.inputPoints[0][0] <== -1 * edwardsFirstPoint.out[0];
    result.inputPoints[0][1] <== edwardsFirstPoint.out[1];
    result.inputPoints[1][0] <== edwardsSecondPoint.out[0];
    result.inputPoints[1][1] <== edwardsSecondPoint.out[1];
    outputPoint[0] <== result.outputPoint[0];
    outputPoint[1] <== result.outputPoint[1];
}
