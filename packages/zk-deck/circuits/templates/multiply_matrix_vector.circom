pragma circom 2.0.0;

template MultiplyMatrixVector(n, m) {
    signal input matrix[n][m];
    signal input inputVector[m];
    signal output outputVector[n];

    signal aux[n][m];
    for (var i = 0; i < n; i++) {
        var sum = 0;
        for (var j = 0; j < m; j++) {
            aux[i][j] <== matrix[i][j] * inputVector[j];
            sum += aux[i][j];
        }
        outputVector[i] <== sum;
    }
}
