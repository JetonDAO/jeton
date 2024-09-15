pragma circom 2.0.0;

template DoubleMontgomeryCurvePoint(edwardsA, edwardsD) {
    signal input inputPoint[2];
    signal output outputPoint[2];

    var montgomeryA = (2 * (edwardsA + edwardsD)) / (edwardsA - edwardsD);
    var montgomeryB = 4 / (edwardsA - edwardsD);

    signal x1_2;
    x1_2 <== inputPoint[0] * inputPoint[0];

    signal lamda;
    lamda <-- (3 * x1_2 + 2 * montgomeryA * inputPoint[0] + 1 ) / (2 * montgomeryB * inputPoint[1]);
    lamda * (2 * montgomeryB * inputPoint[1]) === (3 * x1_2 + 2 * montgomeryA * inputPoint[0] + 1 );

    outputPoint[0] <== montgomeryB * lamda * lamda - montgomeryA - 2 * inputPoint[0];
    outputPoint[1] <== lamda * (inputPoint[0] - outputPoint[0]) - inputPoint[1];
}