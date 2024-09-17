module zk_deck::zk_deck {
    use std::signer;

    struct EncryptedDeck {
        cards: vector<u256>,
        public_keys: vector<u256>,
        num_locks: u8,
    }

    struct DecryptCardShare {}
}
