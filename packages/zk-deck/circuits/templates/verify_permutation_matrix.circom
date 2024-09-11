pragma circom 2.0.0;

template VerifyPermutationMatrix(n) {
    signal input matrix[n][n];

    for (var i = 0; i < n ; i++) {
        for (var j = 0; j < n; j++) {
            matrix[i][j] * (matrix[i][j] - 1) === 0;
        }
    }

    for (var i = 0; i < n; i++) {
        var sum = 0;
        for (var j = 0; j < n; j++) {
            sum += matrix[i][j];
        }
        sum === 1;
    }

    for (var i = 0; i < n; i++) {
        var sum = 0;
        for (var j = 0; j < n; j++) {
            sum += matrix[j][i];
        }
        sum === 1;
    }
}
