module jeton::chip_stack {
    use aptos_framework::event;
    use std::signer;

    const EINSUFFICIENT_BALANCE: u64 = 1;
    const EDESTROY_NON_ZERO: u64 = 1;

    struct ChipStack (u64) has store;

    package fun zero(): ChipStack {
        ChipStack(0)
    }

    #[event]
    struct ChipStackFrom has drop, store {
        addr: address,
        amount: u64,
    }

    package fun from(sender: &signer, amount: u64): ChipStack {
        event::emit(ChipStackFrom{ addr: signer::address_of(sender), amount, });
        ChipStack(amount)
    }

    package fun extract(self: &mut ChipStack, amount: u64): ChipStack {
        if (self.0 < amount) {
            abort EINSUFFICIENT_BALANCE
        };
        self.0 = self.0 - amount;
        ChipStack(amount)
    }

    package fun extract_all(self: &mut ChipStack): ChipStack {
        let amount = self.0;
        self.0 = 0;
        ChipStack(amount)
    }

    package fun merge(self: ChipStack, to: &mut ChipStack) {
        let ChipStack(amount) = self;
        to.0 = to.0 + amount;
    }

    package fun destroy_zero(self: ChipStack) {
        let ChipStack(amount) = self;
        if (amount != 0) {
            abort EDESTROY_NON_ZERO
        };
    }

    #[event]
    struct ChipStackTo has drop, store {
        addr: address,
        amount: u64,
    }

    package fun to(self: ChipStack, receiver: address) {
        let ChipStack(amount) = self;
        event::emit(ChipStackTo{ addr: receiver, amount, });
    }

    package fun transfer(self: &mut ChipStack, to: &mut ChipStack, amount: u64) {
        self.extract(amount).merge(to)
    }

    package fun transfer_all(self: &mut ChipStack, to: &mut ChipStack) {
        self.extract(self.0).merge(to)
    }

    package fun is_zero(self: &ChipStack): bool {
        self.0 == 0
    }

    package fun balance(self: &ChipStack): u64 {
        self.0
    }
}