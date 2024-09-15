pragma circom 2.0.0;

template AddMontgomeryCurvePoints(edwardsA, edwardsD) {
    signal input inputPoints[2][2];
    signal output outputPoint[2];

    var montgomeryA = (2 * (edwardsA + edwardsD)) / (edwardsA - edwardsD);
    var montgomeryB = 4 / (edwardsA - edwardsD);

    signal lamda;
    lamda <-- (inputPoints[1][1] - inputPoints[0][1]) / (inputPoints[1][0] - inputPoints[0][0]);
    lamda * (inputPoints[1][0] - inputPoints[0][0]) === (inputPoints[1][1] - inputPoints[0][1]);

    outputPoint[0] <== montgomeryB * lamda * lamda - montgomeryA - inputPoints[0][0] - inputPoints[1][0];
    outputPoint[1] <== lamda * (inputPoints[0][0] - outputPoint[0]) - inputPoints[0][1];
}