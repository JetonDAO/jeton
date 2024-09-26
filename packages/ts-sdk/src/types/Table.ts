// represents one Table, params are subject to change
export enum ChipUnits {
  apt = "apt",
  usdt = "usdt",
  eth = "eth",
}
export interface TableInfo {
  id: string;
  smallBlind: number;
  numberOfRaises: number;
  minPlayers: number;
  maxPlayers: number;
  minBuyIn: number;
  maxBuyIn: number;
  chipUnit: ChipUnits;
}
