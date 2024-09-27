module jeton::texas_holdem {
    use aptos_framework::account;
    use aptos_framework::aptos_account;
    use aptos_framework::event;
    use aptos_framework::object;
    use aptos_framework::object::Object;
    use aptos_framework::option;
    use aptos_framework::option::Option;
    use aptos_framework::resource_account;
    use std::signer;
    use std::vector;
    use zk_deck::zk_deck;

    const ETABLE_HAS_NO_EMPTY_SEAT: u64 = 1;
    const EPLAYER_HAS_SEAT_ON_TABLE: u64 = 2;
    const EINVALID_ACTION: u64 = 3;

    #[event]
    struct TableCreatedEvent has drop, store {
        table_object: Object<Table>,
    }

    struct Table has key {
        info: TableInfo,
        seats: vector<Option<Player>>,
        dealer_index: u8,
        phase: Phase,
        time_out: u64,
        aggregated_public_key: vector<u8>,
        deck: vector<u8>,
        private_cards_share: vector<vector<u8>>,
        public_cards_share: vector<vector<u8>>,
    }

    struct TableInfo has drop, store {
        action_timeout: u64,
        min_buy_in_amount: u64,
        max_buy_in_amount: u64,
        small_blind: u64,
        num_raises: u8,
        start_at_player: u8,
    }

    enum Phase has drop, store {
        AwaitingStart,
        Shuffle {
            seat_index: u8,
        },
        DrawPrivateCards {
            contributors_index: vector<u8>,
        },
        BetPreFlop {
            seat_index: u8,
            last_raise_index: u8,
            num_raises: u8,
        },
        DrawFlopCards {
            contributors_index: vector<u8>,
        },
        BetFlop {
            seat_index: u8,
            last_raise_index: u8,
            num_raises: u8,
        },
        DrawTurnCard {
            contributors_index: vector<u8>,
        },
        BetTurn {
            seat_index: u8,
            last_raise_index: u8,
            num_raises: u8,
        },
        DrawRiverCard {
            contributors_index: vector<u8>,
        },
        BetRiver {
            seat_index: u8,
            last_raise_index: u8,
            num_raises: u8,
        },
        ShowDown {
            contributors_index: vector<u8>,
        }
    }

    struct Player has drop, store {
        addr: address,
        public_key: vector<u8>,
        balance: u64,
        bet: u64,
        is_folded: bool,
        is_playing: bool,
        is_last_hand: bool,
    }

    public entry fun create_table(
        sender: signer,
        action_timeout: u64,
        min_buy_in_amount: u64,
        max_buy_in_amount: u64,
        small_blind: u64,
        num_raises: u8,
        start_at_player: u8,
        num_seats: u8,
        public_key: vector<u8>,
        buy_in_amount: u64,
    ) acquires Table, SignerCapability {
        let table_constructor_ref = object::create_object(@jeton);
        let table_signer = object::generate_signer(&table_constructor_ref);

        let info = TableInfo {
            action_timeout,
            min_buy_in_amount,
            max_buy_in_amount,
            small_blind,
            num_raises,
            start_at_player,
        };

        let seats = vector::empty();
        for (i in 0..num_seats) {
            vector::push_back(&mut seats, option::none<Player>());
        };

        let table = Table {
            info,
            seats,
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
    ) acquires Table, SignerCapability {
        let table_addr = object::object_address<Table>(&table_object);
        let table = borrow_global_mut<Table>(table_addr);

        zk_deck::check_public_key(&public_key);

        let player_addr = signer::address_of(&sender);
        for (i in 0..vector::length(&table.seats)) {
            let seat = vector::borrow(&table.seats, i);
            if (option::is_none(seat)) {
                continue
            };
            let player = option::borrow(seat);
            if (player.addr == player_addr) {
                abort EPLAYER_HAS_SEAT_ON_TABLE
            };
        };

        let (has_empty_seat, empty_seat_index) =
            vector::find(&table.seats, |seat| option::is_none(seat));
        assert!(has_empty_seat, ETABLE_HAS_NO_EMPTY_SEAT);
        let player = Player {
            addr: player_addr,
            public_key: public_key,
            balance: buy_in_amount,
            bet: 0,
            is_folded: false,
            is_playing: false,
            is_last_hand: false,
        };
        let empty_set = vector::borrow_mut(&mut table.seats, empty_seat_index);
        option::fill(empty_set, player);

        let stake_amount = get_stake_amount(table);
        let total_amount = buy_in_amount + stake_amount;
        aptos_account::transfer(
            &sender,
            table_addr,
            total_amount,
        );

        if (
            (table.phase is Phase::AwaitingStart) &&
            get_num_players(table) >= table.info.start_at_player
        ) {
            start_game(table);
        }
    }

    public entry fun check_out(
        sender: signer,
        table_object: Object<Table>,
    ) acquires Table, SignerCapability {
        let player_addr = signer::address_of(&sender);
        let table_addr = object::object_address<Table>(&table_object);
        let table = borrow_global_mut<Table>(table_addr);
        let num_seats = vector::length(&table.seats);
        for (i in 0..num_seats) {
            let seat = vector::borrow_mut(&mut table.seats, i);
            if (option::is_none(seat)) {
                continue;
            };
            let player = option::borrow_mut(seat);
            if (player.addr != player_addr) {
                continue;
            };
            if (table.phase is Phase::AwaitingStart) {
                check_out_player(table, i);
            } else {
                player.is_last_hand = true;
            };
            return;
        };
        abort EINVALID_ACTION
    }

    fun start_game(table: &mut Table) acquires SignerCapability {
        let num_seats = vector::length(&table.seats);
        let public_keys = vector::empty<vector<u8>>();
        for (i in 0..num_seats) {
            let seat = vector::borrow_mut(&mut table.seats, i);
            if (option::is_none(seat)) {
                continue;
            };
            let player = option::borrow_mut(seat);
            if (player.is_last_hand) {
                check_out_player(table, i);
            };
        };
    }

    fun check_out_player(table: &mut Table, seat_index: u64) acquires SignerCapability {
        let seat = vector::borrow_mut(&mut table.seats, seat_index);
        let player = option::extract(seat);

        let stake_amount = get_stake_amount(table);
        let total_amount = player.balance + stake_amount;

        let jeton_signer = get_jeton_signer();
        aptos_account::transfer(
            &jeton_signer,
            player.addr,
            total_amount,
        );
    }

    fun get_stake_amount(table: &Table): u64 {
        let num_seats = vector::length(&table.seats);
        12 * table.info.small_blind * (table.info.num_raises as u64) * num_seats
    }

    fun get_num_players(table: &Table): u8 {
        let is_empty = vector::map_ref(&table.seats, |seat| option::is_none(seat));
        vector::fold(is_empty, 0, |count, e| if (e) { count } else { count + 1 })
    }

    fun get_next_player_index(table: &Table, seat_index: u8): u8 {
        let num_seats = vector::length(&table.seats) as u8;
        let i = (seat_index + 1 ) % num_seats;
        let seat = vector::borrow(&table.seats, i as u64);
        while(option::is_none(seat)) {
            i = (i + 1) % num_seats;
            seat = vector::borrow(&table.seats, i as u64)
        };
        return i
    }

    struct SignerCapability (account::SignerCapability) has key;

    fun init_module(resource: &signer) {
        let capability = resource_account::retrieve_resource_account_cap(
            resource,
            @jeton,
        );
        let capability = SignerCapability(capability);
        move_to(resource, capability);
    }

    fun get_jeton_signer(): signer acquires SignerCapability{
        let capability = borrow_global<SignerCapability>(@jeton);
        account::create_signer_with_capability(&capability.0)
    }
}