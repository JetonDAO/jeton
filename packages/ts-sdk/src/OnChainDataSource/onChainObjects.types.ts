export type TableAddress = string;

export type ChipStack = {
  _0: string;
};

export type OnChainActivePlayer = {
  addr: string;
  remaining: ChipStack;
  bet: ChipStack;
  stake: ChipStack;
  is_folded: boolean;
  is_last_hand: boolean;
  public_key: string;
};

export type OnChainPendingPlayer = {
  addr: string;
  balance: ChipStack;
  stake: ChipStack;
  public_key: string;
};

export type DrawPrivateCardsPhase = {
  __variant__: "DrawPrivateCards";
  contributors_index: number[];
};

export type DrawPublicCardsPhase = {
  __variant__: "DrawFlopCards" | "DrawTurnCard" | "DrawRiverCard";
  contributors_index: number[];
};

export type ShufflePhase = {
  __variant__: "ShuffleEncrypt";
  turn_index: number;
};

export type BetPhase = {
  __variant__: "BetPreFlop" | "BetFlop" | "BetTurn" | "BetRiver";
  turn_index: number;
  last_raise_index: number;
  raises_left: number;
};

export type OnChainPhase = ShufflePhase | DrawPrivateCardsPhase | BetPhase | DrawPublicCardsPhase;

export type AwaitingStartState = {
  __variant__: "AwaitingStart";
};

export type RemovedState = {
  __variant__: "Removed";
};

export type PlayingState = {
  __variant__: "Playing";
  timeout: string;
  deck: string;
  decryption_card_shares: { data: { key: number; value: string }[] };
  phase: OnChainPhase;
};

export type OnChainGameState = AwaitingStartState | PlayingState | RemovedState;
export type OnChainTableObject = {
  state: OnChainGameState;
  roster: {
    stake_amount: number;
    max_players: number;
    small_index: number;
    waitings: OnChainPendingPlayer[];
    players: OnChainActivePlayer[];
  };
  config: {
    action_timeout: number;
    max_buy_in_amount: number;
    min_buy_in_amount: number;
    num_raises: number;
    small_bet: number;
    start_at_player: number;
    max_players: number;
  };
};
