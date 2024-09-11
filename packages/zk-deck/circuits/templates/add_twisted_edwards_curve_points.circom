pragma circom 2.0.0;

template AddTwistedEdwardsCurvePoints(edwardsA, edwardsD) {
    signal input inputPoints[2][2];
    signal output outputPoint[2];

    signal beta;
    beta <== inputPoints[0][0] * inputPoints[1][1];
    signal gamma;
    gamma <== inputPoints[0][1] * inputPoints[1][0];
    signal delta;
    delta <== (-edwardsA * inputPoints[0][0] + inputPoints[0][1]) * (inputPoints[1][0] + inputPoints[1][1]);
    signal tau;
    tau <== beta * gamma;

    outputPoint[0] <-- (beta + gamma) / (1+ edwardsD * tau);
    (1 + edwardsD * tau) * outputPoint[0] === (beta + gamma);

    outputPoint[1] <-- (delta + edwardsA * beta - gamma) / (1 - edwardsD * tau);
    (1 - edwardsD * tau) * outputPoint[1] === (delta + edwardsA * beta - gamma);
}