module jeton::holdem_table {
    use aptos_framework::event;
    use aptos_framework::object;
    use aptos_framework::object::Object;
    use aptos_framework::timestamp;
    use std::bit_vector;
    use std::bit_vector::BitVector;
    use std::signer;
    use std::vector;
    use zk_deck::zk_deck;
    use zk_deck::zk_deck::{EncryptedDeck, DecryptionShareStore};
    use jeton::holdem_hand;
    use jeton::holdem_roster;
    use jeton::holdem_roster::Roster;

    const EINVALID_BUY_IN_AMOUNT: u64 = 1;
    const EINVALID_ACTION: u64 = 2;
    const EINVALID_SENDER: u64 = 3;
    const ETABLE_IS_REMOVED: u64 = 4;

    fun is_all_set(bv: &BitVector): bool {
        bv.longest_set_sequence_starting_at(0) == bv.length()
    }

    fun private_card_indexes(num_players: u8): vector<u8> {
        let indexes = vector::empty<u8>();
        for (i in 0..num_players) {
            indexes.append(vector[2 * i, 2 * i + 1]);
        };
        indexes
    }

    fun player_private_card_indexes(player_index: u8): vector<u8> {
        vector[player_index * 2, player_index * 2 + 1]
    }

    fun others_private_card_indexes(player_index: u8, num_players: u8): vector<u8> {
        let indexes = vector::empty<u8>();
        for (i in 0..num_players) {
            if (i == player_index) {
                continue
            };
            indexes.append(vector[2 * i, 2 * i + 1]);
        };
        indexes
    }

    fun public_card_indexes(num_players: u8): vector<u8> {
        vector[
            num_players * 2 + 1,
            num_players * 2 + 2,
            num_players * 2 + 3,
            num_players * 2 + 4,
            num_players * 2 + 5,
        ]
    }

    fun flop_card_indexes(num_players: u8): vector<u8> {
        vector[num_players * 2 + 1, num_players * 2 + 2, num_players * 2 + 3]
    }

    fun turn_card_indexes(num_players: u8): vector<u8> {
        vector[num_players * 2 + 4]
    }

    fun river_card_indexes(num_players: u8): vector<u8> {
        vector[num_players * 2 + 5]
    }

    struct Config has drop, store {
        action_timeout: u64,
        min_buy_in_amount: u64,
        max_buy_in_amount: u64,
        small_bet: u64,
        num_raises: u8,
        start_at_player: u8,
        max_players: u8,
    }

    fun timeout_from_now(self: &Config): u64 {
        timestamp::now_seconds() + self.action_timeout
    }

    enum GamePhase has drop, store {
        ShuffleEncrypt {
            turn_index: u8,
        },
        DrawPrivateCards {
            has_contributed: BitVector,
        },
        BetPreFlop {
            turn_index: u8,
            last_raise_index: u8,
            raises_left: u8,
        },
        DrawFlopCards {
            has_contributed: BitVector,
        },
        BetFlop {
            turn_index: u8,
            last_raise_index: u8,
            raises_left: u8,
        },
        DrawTurnCard {
            has_contributed: BitVector,
        },
        BetTurn {
            turn_index: u8,
            last_raise_index: u8,
            raises_left: u8,
        },
        DrawRiverCard {
            has_contributed: BitVector,
        },
        BetRiver {
            turn_index: u8,
            last_raise_index: u8,
            raises_left: u8,
        },
        ShowDown {
            has_contributed: BitVector,
        },
    }

    enum TableState has drop, store {
        AwaitingStart,
        Playing { 
            timeout: u64,
            deck: EncryptedDeck,
            decryption_share_store: DecryptionShareStore,
            phase: GamePhase,
        },
        Removed,
    }

    struct Table has key {
        config: Config,
        roster: Roster,
        state: TableState,
    }

    #[event]
    struct SmallBlindEvent has drop, store {
        table_object: Object<Table>
    }

    #[event]
    struct BigBlindEvent has drop, store {
        table_object: Object<Table>
    }

    #[event]
    struct ShowdownEvent has drop, store {
        table_object: Object<Table>,
        private_cards: vector<u8>,
        public_cards: vector<u8>,
        winning_amounts: vector<u64>,
    }

    fun proceed(self: &mut Table, table_object: Object<Table>) {
        match (&mut self.state) {
            AwaitingStart => {
                if (self.roster.num_waitings() == self.config.start_at_player) {
                    self.roster.refresh_players();
                    self.state = TableState::Playing{
                        timeout: self.config.timeout_from_now(),
                        deck: zk_deck::new_encrypted_deck(),
                        decryption_share_store: zk_deck::new_decryption_share_store(),
                        phase: ShuffleEncrypt{ turn_index: self.roster.small_index() },
                    };
                };
            },
            Playing{ phase, deck, decryption_share_store, .. } => match(phase) {
                ShuffleEncrypt{ turn_index } => {
                    *turn_index = self.roster.next_player_index(*turn_index);
                    if (self.roster.small_index() == *turn_index) {
                        self.state.timeout = self.config.timeout_from_now();
                        self.state.phase = GamePhase::DrawPrivateCards{
                            has_contributed: bit_vector::new(self.roster.num_players() as u64),
                        };
                    };
                },
                DrawPrivateCards{ has_contributed } => {
                    if (is_all_set(has_contributed)) {
                        self.state.timeout = self.config.timeout_from_now();
                        let small_index = self.roster.small_index();
                        self.roster.call(small_index, self.config.small_bet);
                        event::emit(SmallBlindEvent{ table_object });
                        let big_index = self.roster.big_index();
                        self.roster.call(big_index, self.config.small_bet * 2);
                        event::emit(BigBlindEvent{ table_object });
                        let player_index = self.roster.next_player_index(big_index);
                        self.state.phase = GamePhase::BetPreFlop {
                            turn_index: player_index,
                            last_raise_index: player_index,
                            raises_left: self.config.num_raises - 1,
                        };
                    };
                },
                BetPreFlop{ turn_index, last_raise_index, .. } => {
                    *turn_index = self.roster.next_betting_player_index(*turn_index);
                    self.state.timeout = self.config.timeout_from_now();
                    if (turn_index == last_raise_index) {
                        self.state.phase = GamePhase::DrawFlopCards{
                            has_contributed: bit_vector::new(self.roster.num_players() as u64),
                        };
                    };
                },
                DrawFlopCards{ has_contributed } => {
                    if (is_all_set(has_contributed)) {
                        self.state.timeout = self.config.timeout_from_now();
                        let turn_index = self.roster.small_index();
                        self.state.phase = GamePhase::BetFlop {
                            turn_index,
                            last_raise_index: turn_index,
                            raises_left: self.config.num_raises,
                        };
                    };
                },
                BetFlop{ turn_index, last_raise_index, .. } => {
                    *turn_index = self.roster.next_betting_player_index(*turn_index);
                    self.state.timeout = self.config.timeout_from_now();
                    if (turn_index == last_raise_index) {
                        self.state.phase = GamePhase::DrawTurnCard{
                            has_contributed: bit_vector::new(self.roster.num_players() as u64),
                        };
                    };
                },
                DrawTurnCard{ has_contributed } => {
                    if (is_all_set(has_contributed)) {
                        self.state.timeout = self.config.timeout_from_now();
                        let turn_index = self.roster.small_index();
                        self.state.phase = GamePhase::BetTurn {
                            turn_index,
                            last_raise_index: turn_index,
                            raises_left: self.config.num_raises,
                        };
                    };
                },
                BetTurn{ turn_index, last_raise_index, .. } => {
                    *turn_index = self.roster.next_betting_player_index(*turn_index);
                    self.state.timeout = self.config.timeout_from_now();
                    if (turn_index == last_raise_index) {
                        self.state.phase = GamePhase::DrawRiverCard{
                            has_contributed: bit_vector::new(self.roster.num_players() as u64),
                        };
                    };
                },
                DrawRiverCard{ has_contributed } => {
                    if (is_all_set(has_contributed)) {
                        self.state.timeout = self.config.timeout_from_now();
                        let turn_index = self.roster.small_index();
                        self.state.phase = GamePhase::BetRiver {
                            turn_index,
                            last_raise_index: turn_index,
                            raises_left: self.config.num_raises,
                        };
                    };
                },
                BetRiver{ turn_index, last_raise_index, .. } => {
                    *turn_index = self.roster.next_betting_player_index(*turn_index);
                    self.state.timeout = self.config.timeout_from_now();
                    if (turn_index == last_raise_index) {
                        self.state.phase = GamePhase::ShowDown{
                            has_contributed: bit_vector::new(self.roster.num_players() as u64),
                        };
                    };
                },
                ShowDown{ has_contributed } => {
                    if (is_all_set(has_contributed)) {
                        let num_players = self.roster.num_players();
                        let cards = decryption_share_store.decrypt_deck(deck);
                        let private_cards: vector<u8> = private_card_indexes(num_players).map(|index| {
                            let (_, value) = cards.remove(&index);
                            value
                        });
                        let public_cards: vector<u8> = public_card_indexes(num_players).map(|index| {
                            let (_, value) = cards.remove(&index);
                            value
                        });
                        let bet_amounts = self.roster.bet_amounts();
                        let is_foldeds = self.roster.is_foldeds();
                        let winning_amounts = holdem_hand::calculate_winning_amounts(
                            &private_cards,
                            &public_cards,
                            &bet_amounts,
                            &is_foldeds,
                        );
                        self.roster.settle_bets(&winning_amounts);
                        event::emit(ShowdownEvent{
                            table_object,
                            private_cards,
                            public_cards,
                            winning_amounts,
                        });
                        self.roster.refresh_players();
                        if (self.roster.num_players() < 2) {
                            self.roster.remove();
                            self.state = TableState::Removed;
                        } else {
                            self.state = TableState::Playing{
                                timeout: self.config.timeout_from_now(),
                                deck: zk_deck::new_encrypted_deck(),
                                decryption_share_store: zk_deck::new_decryption_share_store(),
                                phase: ShuffleEncrypt{ turn_index: self.roster.small_index() },
                            };
                        };
                    };
                },
            },
            Removed => abort ETABLE_IS_REMOVED,
        };
    }

    #[event]
    struct TableCreatedEvent has drop, store {
        table_object: Object<Table>,
        sender_addr: address,
    }

    public entry fun create_table(
        sender: &signer,
        action_timeout: u64,
        min_buy_in_amount: u64,
        max_buy_in_amount: u64,
        small_bet: u64,
        num_raises: u8,
        start_at_player: u8,
        max_players: u8,
        buy_in_amount: u64,
        public_key: vector<u8>,
    ) acquires Table {
        let sender_addr = signer::address_of(sender);
        let table_constructor_ref = object::create_object(@jeton);
        let table_signer = object::generate_signer(&table_constructor_ref);
        move_to(&table_signer, Table {
            config: Config{
                action_timeout,
                min_buy_in_amount,
                max_buy_in_amount,
                small_bet,
                num_raises,
                start_at_player,
                max_players,
            },
            roster: holdem_roster::new(small_bet, num_raises, max_players),
            state: AwaitingStart,
        });
        let table_object = object::object_from_constructor_ref(&table_constructor_ref);
        event::emit(TableCreatedEvent{ table_object, sender_addr });

        check_in(sender, table_object, buy_in_amount, public_key);
    }

    #[event]
    struct CheckedInEvent has drop, store {
        table_object: Object<Table>,
        sender_addr: address,
    }

    public entry fun check_in(
        sender: &signer,
        table_object: Object<Table>,
        buy_in_amount: u64,
        public_key: vector<u8>,
    ) acquires Table {
        let sender_addr = signer::address_of(sender);
        let table_addr = object::object_address<Table>(&table_object);
        let table = borrow_global_mut<Table>(table_addr);
        if (
            buy_in_amount < table.config.min_buy_in_amount ||
            buy_in_amount > table.config.max_buy_in_amount
        ) {
            abort EINVALID_BUY_IN_AMOUNT;
        };
        table.roster.check_in(sender, buy_in_amount, public_key);
        table.proceed(table_object);
        event::emit(CheckedInEvent{ table_object, sender_addr });
    }

    #[event]
    struct CheckedOutEvent has drop, store {
        table_object: Object<Table>,
        sender_addr: address,
    }

    public entry fun check_out(
        sender: &signer,
        table_object: Object<Table>,
    ) acquires Table {
        let sender_addr = signer::address_of(sender);
        let table_addr = object::object_address<Table>(&table_object);
        let table = borrow_global_mut<Table>(table_addr);
        table.roster.check_out(sender);
        event::emit(CheckedOutEvent{ table_object, sender_addr });
    }

    #[event]
    struct DeckShuffleEncryptedEvent has drop, store {
        table_object: Object<Table>,
        sender_addr: address,
    }

    public entry fun shuffle_encrypt_deck(
        sender: &signer,
        table_object: Object<Table>,
        new_deck: vector<u8>,
        proof: vector<u8>,
    ) acquires Table {
        let sender_addr = signer::address_of(sender);
        let table_addr = object::object_address<Table>(&table_object);
        let table = borrow_global_mut<Table>(table_addr);
        if (
            !(table.state is Playing) ||
            !(table.state.phase is ShuffleEncrypt)
        ) {
            abort EINVALID_ACTION
        };
        let turn_index = table.state.phase.turn_index;
        if (table.roster.player_address(turn_index) != sender_addr) {
            abort EINVALID_SENDER
        };
        table.state.deck.shuffle_encrypt(
            &table.roster.public_keys(),
            &new_deck,
            &proof,
        );
        table.proceed(table_object);
        event::emit(DeckShuffleEncryptedEvent{ table_object, sender_addr });
    }

    #[event]
    struct CardDecryptedShareEvent has drop, store {
        table_object: Object<Table>,
        sender_addr: address,
    }

    public entry fun decrypt_card_shares(
        sender: &signer,
        table_object: Object<Table>,
        shares: vector<vector<u8>>,
        proofs: vector<vector<u8>>,
    ) acquires Table {
        let sender_addr = signer::address_of(sender);
        let table_addr = object::object_address<Table>(&table_object);
        let table = borrow_global_mut<Table>(table_addr);
        if (!(table.state is Playing)) {
            abort EINVALID_ACTION
        };
        let maybe_player_index = table.roster.player_index(sender_addr);
        if (maybe_player_index.is_none()) {
            abort EINVALID_SENDER
        };
        let player_index = maybe_player_index.destroy_some();
        let num_players = table.roster.num_players();
        let (has_contributed, card_indexes) = match (&mut table.state.phase) {
            DrawPrivateCards{ has_contributed } =>
                (has_contributed, others_private_card_indexes(player_index, num_players)),
            DrawFlopCards{ has_contributed } =>
                (has_contributed, flop_card_indexes(num_players)),
            DrawTurnCard{ has_contributed } =>
                (has_contributed, turn_card_indexes(num_players)),
            DrawRiverCard{ has_contributed } =>
                (has_contributed, river_card_indexes(num_players)),
            ShowDown{ has_contributed } =>
                (has_contributed, player_private_card_indexes(player_index)),
            _ => abort EINVALID_ACTION,
        };
        if (has_contributed.is_index_set(player_index as u64)) {
            abort EINVALID_SENDER
        };
        has_contributed.set(player_index as u64);

        let deck = &table.state.deck;
        table.state.decryption_share_store.add_shares(
            deck,
            table.roster.public_key(player_index),
            &card_indexes,
            &shares,
            &proofs,
        );
        table.proceed(table_object);
        event::emit(CardDecryptedShareEvent{ table_object, sender_addr });
    }

    #[event]
    struct FoldedEvent has drop, store {
        table_object: Object<Table>,
        sender_addr: address,
    }

    public entry fun fold(
        sender: &signer,
        table_object: Object<Table>,
    ) acquires Table {
        let sender_addr = signer::address_of(sender);
        let table_addr = object::object_address<Table>(&table_object);
        let table = borrow_global_mut<Table>(table_addr);
        if (
            !(table.state is Playing) ||
            !(table.state.phase is BetPreFlop | BetFlop | BetTurn | BetRiver)
        ) {
            abort EINVALID_ACTION
        };
        let turn_index = table.state.phase.turn_index;
        if (table.roster.player_address(turn_index) != sender_addr) {
            abort EINVALID_SENDER
        };
        table.roster.fold(turn_index);
        table.proceed(table_object);
        event::emit(FoldedEvent{ table_object, sender_addr });
    }

    #[event]
    struct CalledEvent has drop, store {
        table_object: Object<Table>,
        sender_addr: address,
    }

    public entry fun call(
        sender: &signer,
        table_object: Object<Table>,
    ) acquires Table {
        let sender_addr = signer::address_of(sender);
        let table_addr = object::object_address<Table>(&table_object);
        let table = borrow_global_mut<Table>(table_addr);
        if (
            !(table.state is Playing) ||
            !(table.state.phase is BetPreFlop | BetFlop | BetTurn | BetRiver)
        ) {
            abort EINVALID_ACTION
        };
        let turn_index = table.state.phase.turn_index;
        if (table.roster.player_address(turn_index) != sender_addr) {
            abort EINVALID_SENDER
        };
        let max_bet = table.roster.max_players_bet();
        table.roster.call(turn_index, max_bet);
        table.proceed(table_object);
        event::emit(CalledEvent{ table_object, sender_addr });
    }

    #[event]
    struct RaisedEvent has drop, store {
        table_object: Object<Table>,
        sender_addr: address,
    }

    public entry fun raise(
        sender: &signer,
        table_object: Object<Table>,
    ) acquires Table {
        let sender_addr = signer::address_of(sender);
        let table_addr = object::object_address<Table>(&table_object);
        let table = borrow_global_mut<Table>(table_addr);
        if (!(table.state is Playing)) {
            abort EINVALID_ACTION
        };
        let (turn_index, raise_amount) = match(&table.state.phase) {
            BetPreFlop{ turn_index, .. } => (turn_index, 2 * table.config.small_bet),
            BetFlop{ turn_index, .. } => (turn_index, 2 * table.config.small_bet),
            BetTurn{ turn_index, .. } => (turn_index, 4 * table.config.small_bet),
            BetRiver{ turn_index, .. } => (turn_index, 4 * table.config.small_bet),
            _ => abort EINVALID_ACTION,
        };
        if (table.state.phase.raises_left == 0) {
            abort EINVALID_ACTION
        };
        if (table.roster.player_address(*turn_index) != sender_addr) {
            abort EINVALID_SENDER
        };
        let max_bet = table.roster.max_players_bet();
        table.roster.raise(*turn_index, max_bet + raise_amount);
        table.state.phase.last_raise_index = *turn_index;
        table.state.phase.raises_left = table.state.phase.raises_left - 1;
        table.proceed(table_object);
        event::emit(RaisedEvent{ table_object, sender_addr });
    }
}