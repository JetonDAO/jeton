# Jeton: A Decentralized and Trustless Poker Platform

## Abstract

Jeton is a decentralized platform designed to offer a trustless, fair environment for online poker. Built on the Aptos blockchain, Jeton leverages zk-SNARKs, Elgamal encryption, and elliptic curve cryptography to ensure that players can participate in poker games without needing to trust a central authority. The cards are shuffled and encrypted using cryptographic techniques that guarantee fairness, while the game flow and proof verification are handled by smart contracts. This document outlines the core algorithms, cryptographic methods, and the approach taken to achieve fairness and security in the game.

## Problem Definition

Online poker faces significant trust issues due to the centralized nature of most platforms. Players must rely on the platform to handle critical tasks like shuffling and dealing cards, which leaves room for potential manipulation or insider cheating. There is no way for players to verify that the platform has shuffled the deck fairly or that it hasn't been compromised by external attacks, leaving them vulnerable to cheating and fraud.

Additionally, traditional platforms operate as opaque systems, where the processes governing the game remain hidden from the players. This lack of transparency raises concerns about fairness, especially in high-stakes games, where the integrity of the shuffle and the random distribution of cards is vital. Moreover, centralized platforms represent a single point of failure—if the platform itself is hacked or compromised, all players suffer the consequences. Players also have limited control, as platforms can impose fees, restrict access, or set unfavorable conditions.

Jeton addresses these problems by introducing a decentralized, trustless solution that eliminates the need for players to trust a central authority. The system provides full transparency by using cryptographic proofs to guarantee fairness in card shuffling and dealing, ensuring that neither the platform nor any player can manipulate the outcome.

## Algorithm & Approach

Jeton ensures a secure and fair poker game through cryptographic methods that enable the deck to be shuffled, encrypted, and decrypted in a trustless manner. The system leverages Elgamal encryption on the JubJub elliptic curve, zk-SNARKs for cryptographic proofs, and smart contracts on the Aptos blockchain to verify these processes.

### 1. Deck Encryption and Shuffling

At the start of each game, every player broadcasts their Elgamal public key. The system generates an aggregated public key by summing the individual public keys of all players, which is used during the encryption process.

The deck consists of 52 cards, with each card represented by two points on the JubJub curve. Initially, the first point for every card is set to the curve's zero point, while the second point is defined as multiples of the generator point gg: 1g,2g,3g,…,52g1g,2g,3g,…,52g.

To shuffle and encrypt the deck, players use a zk-SNARK circuit. Each player receives the deck from the previous player, along with the aggregated public key. The player provides a random scalar for each card as a private input, and the zk-SNARK circuit updates the card as follows:

    c1′=c1+r⋅gc1′​=c1​+r⋅g
    c2′=c2+r⋅aggregated_public_keyc2′​=c2​+r⋅aggregated_public_key

Here, rr is the player’s private random scalar, and c1c1​ and c2c2​ are the points representing a card. The zk-SNARK circuit also applies a permutation matrix to shuffle the deck. The circuit ensures the permutation is valid, guaranteeing that the deck is both shuffled and encrypted in a way that no player can know its order.

### 2. Decryption Process

Once the game reaches the point where cards need to be revealed, a second zk-SNARK circuit ensures that each player generates their decryption share honestly. The circuit takes as inputs the first point of each card c1c1​, the player’s public key, and their private key (kept secret). Using these inputs, the circuit computes a decryption share for each card:

    decryption_share=secret_key⋅c1decryption_share=secret_key⋅c1​

The zk-SNARK circuit also verifies that the public key corresponds to the private key by ensuring:

    public_key=secret_key⋅gpublic_key=secret_key⋅g

After all players generate and submit their decryption shares, the final decryption of each card is performed by adding together all decryption shares and subtracting the result from the second point c2c2​ of the card. This ensures that the deck is decrypted collectively, and no single player can decrypt it on their own.

### 3. On-Chain Verification

The Aptos blockchain plays a crucial role by verifying the zk-SNARK proofs and validating the public inputs during both the shuffle and decryption phases. The Move smart contracts ensure that all steps in the game are cryptographically secure, transparent, and immutable, preventing any tampering or cheating during gameplay.

## Security Considerations

Ensuring the security and integrity of the poker game is a critical priority for Jeton. The platform implements multiple layers of cryptographic protection to safeguard against tampering, cheating, and unauthorized access. Below are the key security measures:

### 1. Zero-Knowledge Proofs for Fair Play

Jeton relies on zk-SNARKs to provide cryptographic proofs that guarantee the fairness of the shuffle and encryption processes without revealing any private information. The zk-SNARK circuits verify that each player performs the shuffle correctly using valid random scalars and permutation matrices. Any attempt by a player to manipulate the deck is detected and rejected.

### 2. Distributed Decryption to Prevent Cheating

The decryption process is also safeguarded by zk-SNARKs, ensuring that all decryption shares are generated honestly. This distributed decryption mechanism prevents any single player from decrypting the cards independently, maintaining the integrity of the game.

### 3. Elgamal Encryption on the JubJub Curve

Elgamal encryption over the JubJub elliptic curve ensures that the deck is encrypted securely. The use of elliptic curve cryptography offers strong security guarantees while enabling efficient generation of zk-SNARK proofs.

### 4. Trustless and Decentralized Architecture

By decentralizing the game’s logic and using zk-SNARKs, Jeton eliminates the need for a trusted central authority. The game’s operations, including shuffling, encryption, and decryption, are governed by cryptographic proofs and smart contracts, ensuring a trustless, tamper-proof environment.

### 5. Resistance to Insider Manipulation

Since no central party or platform administrator can control the game’s flow or interfere with the shuffle or decryption processes, Jeton is resistant to insider manipulation. Cryptographic proofs ensure that all participants adhere to the rules, protecting the integrity of the game.

### Conclusion

Jeton provides a groundbreaking approach to decentralized online poker by leveraging the power of cryptography and blockchain technology. Through the use of zk-SNARKs, Elgamal encryption on the JubJub curve, and a decentralized architecture built on the Aptos blockchain, Jeton ensures that the game is both secure and transparent. Players no longer need to rely on a centralized platform to ensure fairness—instead, cryptographic proofs guarantee that the shuffle, encryption, and decryption processes are tamper-proof and trustless.

By eliminating the need for a central authority and enabling a fully transparent gameplay experience, Jeton redefines the standards for fairness and security in online poker. Although challenges like collusion and multi-account play remain unsolved for now, the platform offers a robust foundation for decentralized card games, ensuring that no player or entity can manipulate the outcome.

As the project continues to evolve, Jeton sets a strong precedent for future innovations in decentralized gaming, with cryptographic fairness at its core.
