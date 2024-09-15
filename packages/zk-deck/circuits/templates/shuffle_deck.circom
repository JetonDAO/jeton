pragma circom 2.0.0;

include "./multiply_matrix_vector.circom";
include "./verify_permutation_matrix.circom";

template ShuffleDeck(numCards) {
    signal input permutationMatrix[numCards][numCards];
    signal input inputDeck[numCards][4];
    signal output outputDeck[numCards][4];

    component verifyPermutationMatrix = VerifyPermutationMatrix(numCards);
    for (var i = 0; i < numCards; i++) {
        for (var j = 0; j < numCards; j++) {
            verifyPermutationMatrix.matrix[i][j] <== permutationMatrix[i][j];
        }
    }

    component multiplyMatrixVector[4];
    for (var i = 0; i < 4; i++) {
        multiplyMatrixVector[i] = MultiplyMatrixVector(numCards, numCards);
        for (var j = 0; j < numCards; j++) {
            for (var k = 0; k < numCards; k++) {
                multiplyMatrixVector[i].matrix[j][k] <== permutationMatrix[j][k];
            }
            multiplyMatrixVector[i].inputVector[j] <== inputDeck[j][i];
        }
        for (var j = 0; j < numCards; j++) {
            outputDeck[j][i] <== multiplyMatrixVector[i].outputVector[j];
        }
    }
}
