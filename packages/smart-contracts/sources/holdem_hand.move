module jeton::holdem_hand {
    use aptos_std::comparator;
    use std::option;
    use std::option::Option;
    use std::vector;

    fun sort_cards(cards: &mut vector<u8>) {
        let num_cards = cards.length();
        for (i in 0..num_cards) {
            for (j in (i+1)..num_cards) {
                if (cards[i] < cards[j]) {
                    cards.swap(i, j);
                };
            };
        };
    }

    fun find_straight(values: &vector<u8>): Option<u8> {
        let num_cards = values.length();
        let last_value = values[0];
        let num_straights = 1;
        for (i in 1..num_cards) {
            let value = values[i];
            if (value == last_value) {
                continue;
            };
            if (last_value - value == 1) {
                num_straights = num_straights + 1;
                if (num_straights == 5) {
                    return option::some(value + 4)
                };
            } else {
                num_straights = 1;
            };
            last_value = value;
        };
        if (num_straights == 4 && last_value == 0 && values[0] == 12) {
            return option::some(3)
        };
        option::none()
    }

    fun evaluate_hand(cards: vector<u8>): vector<u8> {
        sort_cards(&mut cards);
        let num_cards = cards.length();
        let four_of_kind = option::none<u8>();
        let three_of_kind = option::none<u8>();
        let first_pair = option::none<u8>();
        let second_pair = option::none<u8>();
        let kickers = vector::empty<u8>();
        let values = vector::empty<u8>();
        let clubs = vector::empty<u8>();
        let diamonds = vector::empty<u8>();
        let hearts = vector::empty<u8>();
        let spades = vector::empty<u8>();

        let last_value = cards[0] / 4;
        let last_value_count = 1;
        values.push_back(last_value);
        if (cards[0] % 4 == 0) {
            clubs.push_back(last_value);
        } else if (cards[0] % 4 == 1) {
            diamonds.push_back(last_value);
        } else if (cards[0] % 4 == 2) {
            hearts.push_back(last_value);
        } else {
            spades.push_back(last_value);
        };
        for (i in 1..(num_cards+1)) {
            if (i < num_cards && cards[i] / 4 == last_value) {
                last_value_count = last_value_count + 1;
                continue;
            };
            if (last_value_count == 4 && four_of_kind.is_none()) {
                four_of_kind.fill(last_value);
            } else if (last_value_count >= 3 && three_of_kind.is_none()) {
                three_of_kind.fill(last_value);
            } else if (last_value_count >= 2 && first_pair.is_none()) {
                first_pair.fill(last_value);
            } else if (last_value_count >= 2 && second_pair.is_none()) {
                second_pair.fill(last_value);
            } else {
                kickers.push_back(last_value);
            };
            if (i < num_cards) {
                last_value = cards[i] / 4;
                last_value_count = 1;
                values.push_back(last_value);
                if (cards[0] % 4 == 0) {
                    clubs.push_back(last_value);
                } else if (cards[0] % 4 == 1) {
                    diamonds.push_back(last_value);
                } else if (cards[0] % 4 == 2) {
                    hearts.push_back(last_value);
                } else {
                    spades.push_back(last_value);
                }
            };
        };

        // Straight Flush
        let clubs_straight = find_straight(&clubs);
        if (clubs_straight.is_some()) {
            return vector[8, clubs_straight.destroy_some()]
        };
        let diamonds_straight = find_straight(&diamonds);
        if (diamonds_straight.is_some()) {
            return vector[8, diamonds_straight.destroy_some()]
        };
        let hearts_straight = find_straight(&hearts);
        if (hearts_straight.is_some()) {
            return vector[8, hearts_straight.destroy_some()]
        };
        let spades_straight = find_straight(&spades);
        if (spades_straight.is_some()) {
            return vector[8, spades_straight.destroy_some()]
        };

        // Four of a Kind
        if (four_of_kind.is_some()) {
            return vector[7, four_of_kind.destroy_some()]
        };

        // Full House
        if (three_of_kind.is_some() && first_pair.is_some()) {
            return vector[6, three_of_kind.destroy_some(), first_pair.destroy_some()]
        };

        // Flush
        if (clubs.length() >= 5) {
            let rank = vector[5];
            rank.append(clubs.slice(0, 5));
            return rank;
        };
        if (diamonds.length() >= 5) {
            let rank = vector[5];
            rank.append(diamonds.slice(0, 5));
            return rank;
        };
        if (hearts.length() >= 5) {
            let rank = vector[5];
            rank.append(hearts.slice(0, 5));
            return rank;
        };
        if (spades.length() >= 5) {
            let rank = vector[5];
            rank.append(spades.slice(0, 5));
            return rank;
        };

        // Straight
        let values_straight = find_straight(&values);
        if (values_straight.is_some()) {
            return vector[4, values_straight.destroy_some()]
        };

        // Three of a Kind
        if (three_of_kind.is_some()) {
            let rank = vector[3, three_of_kind.destroy_some()];
            rank.append(kickers.slice(0, 2));
            return rank
        };

        if (first_pair.is_some() && second_pair.is_some()) {
            return vector[
                2,
                first_pair.destroy_some(),
                second_pair.destroy_some(),
                kickers.pop_back(),
            ]
        };

        if (first_pair.is_some()) {
            let rank = vector[1, first_pair.destroy_some()];
            rank.append(kickers.slice(0, 3));
            return rank
        };

        let rank = vector[0];
        rank.append(kickers.slice(0, 5));
        rank
    }

    fun sort_hands(
        private_cards: &vector<u8>,
        public_cards: &vector<u8>,
        is_foldeds: &vector<bool>,
    ): vector<vector<u8>> {
        let num_players = private_cards.length() / 2;
        let ranks = vector::empty<vector<u8>>();
        let classes = vector::empty<vector<u8>>();
        let foldeds = vector::empty<u8>();
        for (i in 0..num_players) {
            if (is_foldeds[i]) {
                foldeds.push_back(i as u8);
                continue
            };
            let cards = *public_cards;
            cards.append(private_cards.slice((2*i) as u64, (2*i+2) as u64));
            let rank = evaluate_hand(cards);
            
            let num_classes = classes.length();
            for (j in 0..num_classes) {
                let compare = comparator::compare_u8_vector(copy rank, ranks[j]);
                if (comparator::is_equal(&compare)) {
                    classes[i].push_back(i as u8);
                    break
                };
                if (comparator::is_greater_than(&compare)) {
                    classes.insert(j, vector[i as u8]);
                    ranks.insert(j, rank);
                    break
                };
                if (i == num_classes - 1) {
                    classes.push_back(vector[i as u8]);
                    ranks.push_back(rank);
                };
            };
        };
        classes.push_back(foldeds);
        classes
    }

    package fun calculate_winning_amounts(
        private_cards: &vector<u8>,
        public_cards: &vector<u8>,
        bet_amounts: &vector<u64>,
        is_foldeds: &vector<bool>,
    ): vector<u64> {
        let num_players = bet_amounts.length();
        let pot_amount = 0;
        for (i in 0..num_players) {
            pot_amount = pot_amount + bet_amounts[i];
        };
        let winning_amounts = vector::empty<u64>();
        for (i in 0..num_players) {
            winning_amounts.push_back(0);
        };
        let sorted = sort_hands(private_cards, public_cards, is_foldeds);
        winning_amounts[sorted[0][0] as u64] = pot_amount;
        winning_amounts
    }
}