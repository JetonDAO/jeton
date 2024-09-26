module jeton::texas_holdem {
    use aptos_framework::aptos_account;
    use aptos_framework::event;
    use aptos_framework::object;
    use aptos_framework::object::Object;
    use aptos_framework::option;
    use aptos_framework::option::Option;
    use std::signer;
    use std::vector;
    use zk_deck::zk_deck;

    #[event]
    struct TableCreatedEvent has drop, store {
        table_object: Object<Table>,
    }

    struct Table has key {
        info: TableInfo,
        seets: vector<Option<Player>>,
        dealer_index: u8,
        phase: Phase,
        time_out: u64,
        aggregated_public_key: vector<u8>,
        deck: vector<u8>,
        private_cards_share: vector<vector<u8>>,
        public_cards_share: vector<vector<u8>>,
    }

    struct TableInfo has store {
        action_timeout: u64,
        min_buy_in_amount: u64,
        max_buy_in_amount: u64,
        small_blind: u64,
        num_raises: u8,
        start_at_player: u8,
    }

    enum Phase has store {
        AwaitingStart,
        Shuffle {
            seet_index: u8,
        },
        DrawPrivateCards {
            contributors_index: vector<u8>,
        },
        BetPreFlop {
            seet_index: u8,
            last_raise_index: u8,
            num_raises: u8,
        },
        DrawFlopCards {
            contributors_index: vector<u8>,
        },
        BetFlop {
            seet_index: u8,
            last_raise_index: u8,
            num_raises: u8,
        },
        DrawTurnCard {
            contributors_index: vector<u8>,
        },
        BetTurn {
            seet_index: u8,
            last_raise_index: u8,
            num_raises: u8,
        },
        DrawRiverCard {
            contributors_index: vector<u8>,
        },
        BetRiver {
            seet_index: u8,
            last_raise_index: u8,
            num_raises: u8,
        },
        ShowDown {
            contributors_index: vector<u8>,
        }
    }

    struct Player has store {
        addr: address,
        public_key: vector<u8>,
        balance: u64,
        bet: u64,
        is_folded: bool,
        is_playing: bool,
        is_last_hand: bool,
    }

    const ETABLE_HAS_NO_EMPTY_SEET: u64 = 1;
    const EPLAYER_HAS_SEET_ON_TABLE: u64 = 2;

    public entry fun create_table(
        sender: signer,
        action_timeout: u64,
        min_buy_in_amount: u64,
        max_buy_in_amount: u64,
        small_blind: u64,
        num_raises: u8,
        start_at_player: u8,
        num_seets: u8,
        public_key: vector<u8>,
        buy_in_amount: u64,
    ) acquires Table {
        let table_constructor_ref = object::create_object(signer::address_of(&sender));
        let table_signer = object::generate_signer(&table_constructor_ref);

        let info = TableInfo {
            action_timeout,
            min_buy_in_amount,
            max_buy_in_amount,
            small_blind,
            num_raises,
            start_at_player,
        };

        let seets = vector::empty();
        for (i in 0..num_seets) {
            vector::push_back(&mut seets, option::none<Player>());
        };

        let table = Table {
            info,
            seets,
            dealer_index: 0,
            phase: Phase::AwaitingStart,
            time_out: 0,
            aggregated_public_key: vector::empty(),
            deck: vector::empty(),
            private_cards_share: vector::empty(),
            public_cards_share: vector::empty(),
        };

        move_to(&table_signer, table);
        let table_object = object::object_from_constructor_ref(&table_constructor_ref);
        event::emit(TableCreatedEvent {
            table_object,
        });
        check_in(sender, table_object, public_key, buy_in_amount);
    }

    public entry fun check_in(
        sender: signer,
        table_object: Object<Table>,
        public_key: vector<u8>,
        buy_in_amount: u64,
    ) acquires Table {
        let table_addr = object::object_address<Table>(&table_object);
        let table = borrow_global_mut<Table>(table_addr);

        zk_deck::check_public_key(&public_key);

        let player_addr = signer::address_of(&sender);
        for (i in 0..vector::length(&table.seets)) {
            let seet = vector::borrow(&table.seets, i);
            if (option::is_none(seet)) {
                continue
            };
            let player = option::borrow(seet);
            if (player.addr == player_addr) {
                abort EPLAYER_HAS_SEET_ON_TABLE
            };
        };

        let (has_empty_seet, empty_seet_index) =
            vector::find(&table.seets, |seet| option::is_none(seet));
        assert!(has_empty_seet, ETABLE_HAS_NO_EMPTY_SEET);
        let player = Player {
            addr: player_addr,
            public_key: public_key,
            balance: buy_in_amount,
            bet: 0,
            is_folded: false,
            is_playing: false,
            is_last_hand: false,
        };
        let empty_set = vector::borrow_mut(&mut table.seets, empty_seet_index);
        option::fill(empty_set, player);

        let stake_amount = get_stake_amount(table);
        let total_amount = buy_in_amount + stake_amount;
        aptos_account::transfer(
            &sender,
            table_addr,
            total_amount,
        );

        if (table.phase is Phase::AwaitingStart) {
            let num_players = get_num_players(table);
            if (num_players >= table.info.start_at_player) {
                start_game(table);
            }
        }
    }

    fun start_game(table: &mut Table) {
        
    }

    fun get_stake_amount(table: &Table): u64 {
        let num_seets = vector::length(&table.seets);
        12 * table.info.small_blind * (table.info.num_raises as u64) * num_seets
    }

    fun get_num_players(table: &Table): u8 {
        let is_empty = vector::map_ref(&table.seets, |seet| option::is_none(seet));
        vector::foldr(is_empty, 0, |e, count| if (e) { count } else { count + 1 })
    }
}