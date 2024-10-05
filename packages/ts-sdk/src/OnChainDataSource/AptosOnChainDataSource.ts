import { EventEmitter } from "events";
import type {
  OnChainDataSource,
  OnChainDataSourceInstance,
  OnChainEventMap,
  OnChainTableObject,
} from "@src/OnChainDataSource";
import { createTableInfo } from "@src/contracts/contractDataMapper";
import {
  callCheckInContract,
  createTableObject,
  getTableObject,
  getTableObjectAddresses,
} from "@src/contracts/contractInteractions";
import type { ChipUnits, TableInfo } from "@src/types";
// @ts-ignore
import { gql, request } from "graffle";

export class AptosOnChainDataSource
  extends EventEmitter<OnChainEventMap>
  implements OnChainDataSourceInstance
{
  constructor(
    public address: string,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    private singAndSubmitTransaction: (...args: any) => Promise<{ hash: string }>,
  ) {
    super();
    this.address = address;
  }

  public async createTable(
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
  ) {
    const [tableAddress, tableResourceObject] = await createTableObject(
      smallBlind,
      numberOfRaises,
      minPlayers,
      minBuyIn,
      maxBuyIn,
      buyInAmount,
      this.address,
      publicKey,
      this.singAndSubmitTransaction,
    );
    const tableInfo = createTableInfo(tableAddress, tableResourceObject);
    return tableInfo;
  }

  async queryGameState<T extends keyof OnChainTableObject>(
    id: string,
    fields: T[],
  ): Promise<Pick<OnChainTableObject, T>> {
    console.log("query game state");
    //TODO
    const tableObject = (await getTableObject(id)) as OnChainTableObject;
    console.log("OnChainTableObject", tableObject);
    return tableObject;
  }

  async checkIn(tableId: string, buyInAmount: number, publicKey: Uint8Array) {
    // TODO: test
    return await callCheckInContract(
      this.address,
      buyInAmount,
      publicKey,
      tableId,
      this.singAndSubmitTransaction,
    );
  }

  async queryEvents(tableId: string) {
    const document = gql`
    query MyQuery {
  events(
    where: {indexed_type: {_eq: "${tableId}::texas_holdem::TableCreatedEvent"}, data: {_cast: {String: {_like: "%0x73639065d084db4d47531fcae25da3fd003ae43dec691f53a7ef5dcce072676c%"}}}}
  ) {
    data,
    indexed_type
  }
}
`;
    const res = await request(
      "https://aptos-testnet.nodit.io/tUOKeLdo0yUmJsNgwfln97h_03wYs8mP/v1/graphql",
      document,
    );
    console.log("res is", res);
  }

  static async getTableInfo(id: string) {
    const tableObjectResource = await getTableObject(id);
    const tableInfo = createTableInfo(id, tableObjectResource);
    return tableInfo;
  }

  static async getTablesInfo() {
    //TODO paginate
    const result = await getTableObjectAddresses();
    console.log("get tables objectsAddresses", result);
    const tablePromises: Promise<TableInfo>[] = [];

    for (const event of result) {
      const tableObjectAddress = event.data.table_object.inner;
      tablePromises.push(
        getTableObject(tableObjectAddress).then((tableObjectResource) => {
          console.log(tableObjectResource);
          return createTableInfo(tableObjectAddress, tableObjectResource);
        }),
      );
    }

    return await Promise.all(tablePromises);
  }
}
