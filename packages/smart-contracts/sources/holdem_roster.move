module jeton::holdem_roster {
    use aptos_framework::option;
    use aptos_framework::option::Option;
    use std::signer;
    use std::vector;
    use zk_deck::zk_deck;
    use zk_deck::zk_deck::PublicKey;
    use jeton::chip_stack;
    use jeton::chip_stack::ChipStack;

    const EROSTER_IS_FULL: u64 = 1;
    const EADDRESS_IS_ALREADY_CHECKED_IN: u64 = 2;
    const EADDRESS_IS_NOT_CHECKED_IN: u64 = 3;
    const EINSUFFICIENT_REMAINING: u64 = 4;
    const ELAST_NOT_FOLDED_PLAYER: u64 = 5;

    struct PendingPlayer has store {
        addr: address,
        balance: ChipStack,
        stake: ChipStack,
        public_key: PublicKey,
    }

    fun new_pending_player(
        sender: &signer,
        buy_in_amount: u64,
        stake_amount: u64,
        public_key_bytes: vector<u8>,
    ): PendingPlayer {
        let addr = signer::address_of(sender);
        let balance = chip_stack::from(sender, buy_in_amount + stake_amount);
        let stake = balance.extract(stake_amount);
        let public_key = zk_deck::new_public_key(public_key_bytes);
        PendingPlayer { addr, balance, stake, public_key }
    }

    fun remove_pending_player(self: PendingPlayer) {
        let PendingPlayer{ addr, balance, stake, .. } = self;
        stake.merge(&mut balance);
        balance.to(addr);
    }

    fun to_active_player(self: PendingPlayer): ActivePlayer {
        let PendingPlayer{ addr, balance, stake, public_key } = self;
        ActivePlayer {
            addr,
            remaining: balance,
            bet: chip_stack::zero(),
            stake,
            is_folded: false,
            is_last_hand: false,
            public_key,
        }
    }

    struct ActivePlayer has store {
        addr: address,
        remaining: ChipStack,
        bet: ChipStack,
        stake: ChipStack,
        is_folded: bool,
        is_last_hand: bool,
        public_key: PublicKey,
    }

    fun remove_active_player(self: ActivePlayer) {
        let ActivePlayer{ addr, remaining, bet, stake, .. } = self;
        bet.destroy_zero();
        stake.merge(&mut remaining);
        remaining.to(addr);
    }

    fun kick_active_player(self: ActivePlayer): ChipStack {
        let ActivePlayer{ addr, remaining, bet, stake, .. } = self;
        bet.destroy_zero();
        remaining.to(addr);
        stake
    }

    struct Roster has store {
        stake_amount: u64,
        max_players: u8,
        small_index: u8,
        waitings: vector<PendingPlayer>,
        players: vector<ActivePlayer>,
    }

    package fun new(small_blind: u64, num_raises: u8, max_players: u8): Roster {
        let stake_amount = 12 * small_blind * (num_raises as u64) * (max_players as u64);
        Roster {
            stake_amount,
            max_players,
            small_index: 0,
            waitings: vector::empty<PendingPlayer>(),
            players: vector::empty<ActivePlayer>(),
        }
    }

    package fun num_waitings(self: &Roster): u8 {
        self.waitings.length() as u8
    }

    package fun waiting_index(self: &Roster, addr: address): Option<u8> {
        let (is_waiting, index) = self.waitings.find(|player| player.addr == addr);
        if (is_waiting) {
            option::some(index as u8)
        } else {
            option::none()
        }
    }

    package fun num_players(self: &Roster): u8 {
        self.players.length() as u8
    }

    package fun player_index(self: &Roster, addr: address): Option<u8> {
        let (has_seat, index) = self.players.find(|player| player.addr == addr);
        if (has_seat) {
            option::some(index as u8)
        } else {
            option::none()
        }
    }

    package fun small_index(self: &Roster): u8 {
        self.small_index
    }

    package fun big_index(self: &Roster): u8 {
        self.next_player_index(self.small_index)
    }

    package fun next_player_index(self: &Roster, player_index: u8): u8 {
        let num_players = self.players.length() as u8;
        (player_index + 1) % num_players
    }

    package fun next_betting_player_index(self: &Roster, player_index: u8): u8 {
        let next = self.next_player_index(player_index);
        while (self.is_folded(next) || self.is_all_in(next)) {
            next = self.next_player_index(next);
        };
        next
    }

    package fun is_full(self: &Roster): bool {
        let num_actives = self.players.map_ref(|player| {
            player.is_last_hand
        }).fold(0u8, |count, last_hand| {
            if (last_hand) { count } else { count + 1 }
        });
        num_actives + self.num_waitings() == self.max_players
    }

    package fun bet_amounts(self: &Roster): vector<u64> {
        self.players.map_ref(|player| player.bet.balance())
    }

    package fun public_keys(self: &Roster): vector<PublicKey> {
        self.players.map_ref(|player| player.public_key)
    }

    package fun is_foldeds(self: &Roster): vector<bool> {
        self.players.map_ref(|player| player.is_folded)
    }

    package fun max_players_bet(self: &Roster): u64 {
        self.players.map_ref(|player| player.bet.balance()).fold(
            0,
            |max, balance| if (balance > max) { balance } else { max },
        )
    }

    package fun player_address(self: &Roster, player_index: u8): address {
        self.players.borrow(player_index as u64).addr
    }

    package fun public_key(self: &Roster, player_index: u8): &PublicKey {
        &self.players.borrow(player_index as u64).public_key
    }

    package fun is_folded(self: &Roster, player_index: u8): bool {
        self.players.borrow(player_index as u64).is_folded
    }

    package fun is_all_in(self: &Roster, player_index: u8): bool {
        self.players.borrow(player_index as u64).remaining.balance() == 0
    }

    package fun check_in(
        self: &mut Roster,
        sender: &signer,
        buy_in_amount: u64,
        public_key: vector<u8>,
    ) {
        if (self.is_full()) {
            abort EROSTER_IS_FULL
        };
        let sender_addr = signer::address_of(sender);
        if (
            self.waiting_index(sender_addr).is_some() ||
            self.player_index(sender_addr).is_some()
        ) {
            abort EADDRESS_IS_ALREADY_CHECKED_IN
        };
        let player = new_pending_player(sender, buy_in_amount, self.stake_amount, public_key);
        self.waitings.insert(0, player);
    }

    package fun check_out(self: &mut Roster, sender: &signer) {
        let sender_addr = signer::address_of(sender);
        let maybe_waiting_index = self.waiting_index(sender_addr);
        if (maybe_waiting_index.is_some()) {
            self.waitings.remove(
                maybe_waiting_index.destroy_some() as u64,
            ).remove_pending_player();
            return
        };

        let maybe_player_index = self.player_index(sender_addr);
        if (maybe_player_index.is_none()) {
            abort EADDRESS_IS_NOT_CHECKED_IN
        };
        let player = self.players.borrow_mut(maybe_player_index.destroy_some() as u64);
        player.is_last_hand = true;
    }

    package fun kick(self: &mut Roster, player_indexes: vector<u8>) {}

    package fun settle_bets(self: &mut Roster, winning_amounts: &vector<u64>) {
        let pot = self.players.borrow_mut(0).bet.extract_all();
        let num_players = self.players.length();
        for (i in 1..num_players) {
            self.players.borrow_mut(i).bet.transfer_all(&mut pot);
        };

        for (i in 0..num_players) {
            pot.transfer(&mut self.players.borrow_mut(i).remaining, winning_amounts[i]);
        };
        pot.destroy_zero();
    }

    package fun refresh_players(self: &mut Roster) {
        let num_players = self.players.length();
        for (i in 0..num_players) {
            let player = self.players.borrow_mut(i);
            if (!(player.is_last_hand || player.remaining.is_zero())) {
                player.is_folded = false;
                continue
            };
            if (self.num_waitings() > 0) {
                let last_index = self.players.length() - 1;
                self.players.swap_remove(i).remove_active_player();
                self.players.push_back(self.waitings.pop_back().to_active_player());
                self.players.swap(i, last_index);
            } else {
                self.players.remove(i).remove_active_player();
            };
        };
        while (self.num_waitings() > 0) {
            self.players.push_back(self.waitings.pop_back().to_active_player());
        };
    }

    package fun shift_small(self: &mut Roster) {
        self.small_index = self.next_player_index(self.small_index);
    }

    package fun remove(self: &mut Roster) {
        while (!self.waitings.is_empty()) {
            self.waitings.pop_back().remove_pending_player()
        };
        while (!self.players.is_empty()) {
            self.players.pop_back().remove_active_player()
        };
    }

    package fun fold(self: &mut Roster, player_index: u8) {
        let player = self.players.borrow_mut(player_index as u64);
        player.is_folded = true;
        assert!(
            self.players.all(|player| player.is_folded),
            ELAST_NOT_FOLDED_PLAYER,
        )
    }

    package fun call(self: &mut Roster, player_index: u8, call_amount: u64) {
        let player = self.players.borrow_mut(player_index as u64);
        let remaining_amount = player.remaining.balance();
        let diff_amount = call_amount - player.bet.balance();
        let amount = if (remaining_amount < diff_amount) {
            remaining_amount
        } else {
            diff_amount
        };
        player.remaining.transfer(&mut player.bet, amount);
    }

    package fun raise(self: &mut Roster, player_index: u8, raise_amount: u64) {
        let player = self.players.borrow_mut(player_index as u64);
        let diff_amount = raise_amount - player.bet.balance();
        if (player.remaining.balance() < diff_amount) {
            abort EINSUFFICIENT_REMAINING
        };
        player.remaining.transfer(&mut player.bet, diff_amount);
    }
}