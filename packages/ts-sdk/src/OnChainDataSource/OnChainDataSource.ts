import type EventEmitter from "events";
import type { ChipUnits, TableInfo } from "../types/Table";
import type { OnChainEventMap } from "./onChainEvents.types";
import type { OnChainTableObject } from "./onChainObjects.types";

export interface OnChainDataSource {
  new (
    address: string,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    singAndSubmitTransaction: (...args: any) => Promise<{ hash: string }>,
  ): OnChainDataSourceInstance;

  getTableInfo(id: string): Promise<TableInfo>;
  getTablesInfo(id: string): Promise<TableInfo>;
}
export interface OnChainDataSourceInstance extends EventEmitter<OnChainEventMap> {
  createTable(
    smallBlind: number,
    // number of raises allowed in one round of betting
    numberOfRaises: number,
    // minimum number of players required to start the game
    minPlayers: number,
    // minimum amount a player is allowed to check in with
    minBuyIn: number,
    // maximum amount a player is allowed to check in with
    maxBuyIn: number,
    buyInAmount: number,
    // how many seconds does each player have to act?
    waitingTimeOut: number,
    chipUnit: ChipUnits,
    publicKey: Uint8Array,
  ): Promise<TableInfo>;

  queryGameState<T extends keyof OnChainTableObject>(
    id: string,
    fields: T[],
  ): Promise<Pick<OnChainTableObject, T>>;

  checkIn(tableId: string, buyInAmount: number, publicKey: Uint8Array): Promise<void>;
}
