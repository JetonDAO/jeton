export type OnChainPlayer = {
  addr: string;
  public_key: Uint8Array;
  balance: number;
  bet: number;
  is_folded: boolean;
  is_playing: boolean;
  is_last_hand: boolean;
};

export type DrawPrivateCardsPhase = {
  type: "DrawPrivateCards";
  contributors_index: number[];
};

export type ShufflePhase = {
  type: "Shuffle";
  seat_index: number;
};

export type AwaitingStartPhase = {
  type: "AwaitingStart";
};

export type OnChainPhase = AwaitingStartPhase | ShufflePhase | DrawPrivateCardsPhase;

export type OnChainTableObject = {
  seets: ({ vec: [OnChainPlayer] } | { vec: [] })[];
  dealer_index: number;
  phase: OnChainPhase;
  time_out: number;
  aggregated_public_key: Uint8Array[];
  deck: Uint8Array[];
  private_cards_share: Uint8Array[][];
  public_cards_share: Uint8Array[][];
  info: {
    action_timeout: number;
    max_buy_in_amount: number;
    min_buy_in_amount: number;
    num_raises: number;
    small_blind: number;
    start_at_player: number;
  };
};
