pragma circom 2.0.0;

include "./multiply_matrix_vector.circom";
include "./verify_permutation_matrix.circom";

template ShuffleDeck(n) {
    signal input permutationMatrix[n][n];
    signal input inputDeck[n][4];
    signal output outputDeck[n][4];

    component verifyPermutationMatrix = VerifyPermutationMatrix(n);
    for (var i = 0; i < n; i++) {
        for (var j = 0; j < n; j++) {
            verifyPermutationMatrix.matrix[i][j] <== permutationMatrix[i][j];
        }
    }

    component multiplyMatrixVector[4];
    for (var i = 0; i < 4; i++) {
        multiplyMatrixVector[i] = MultiplyMatrixVector(n, n);
        for (var j = 0; j < n; j++) {
            for (var k = 0; k < n; k++) {
                multiplyMatrixVector[i].matrix[j][k] <== permutationMatrix[j][k];
            }
            multiplyMatrixVector[i].inputVector[j] <== inputDeck[j][i];
        }
        for (var j = 0; j < n; j++) {
            outputDeck[j][i] <== multiplyMatrixVector[i].outputVector[j];
        }
    }
}
