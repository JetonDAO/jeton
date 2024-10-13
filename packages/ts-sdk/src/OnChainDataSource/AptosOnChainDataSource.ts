import { EventEmitter } from "events";
import {
  type OnChainDataSourceInstance,
  type OnChainEventMap,
  OnChainEventTypes,
  type OnChainTableObject,
} from "@src/OnChainDataSource";
import {
  contractBigBlindEventType,
  contractCallEventType,
  contractCardDecryptionShareEventType,
  contractCheckedInEventType,
  contractFoldEventType,
  contractRaiseEventType,
  contractShuffleEventType,
  contractSmallBlindEventType,
} from "@src/contracts/contractData";
import { createTableInfo } from "@src/contracts/contractDataMapper";
import {
  callCallContract,
  callCheckInContract,
  callDecryptCardShares,
  callFoldContract,
  callRaiseContract,
  callShuffleEncryptDeck,
  createTableObject,
  getTableObject,
  getTableObjectAddresses,
  queryEvents,
} from "@src/contracts/contractInteractions";
import { BettingActions, type ChipUnits, PlacingBettingActions, type TableInfo } from "@src/types";
import { POLLING_INTERVAL } from "./constants";

export class AptosOnChainDataSource
  extends EventEmitter<OnChainEventMap>
  implements OnChainDataSourceInstance
{
  pollingTables: Record<
    string,
    { timerId: number | NodeJS.Timeout; lastEventBlockHeight?: number }
  > = {};

  constructor(
    public address: string,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    private singAndSubmitTransaction: (...args: any) => Promise<{ hash: string }>,
  ) {
    super();
    this.address = address;
  }

  private publishEvent(event: { data: { sender_addr: string }; indexed_type: string }) {
    console.log("publish event", event);
    switch (event.indexed_type) {
      case contractCheckedInEventType:
        console.log("publishing", OnChainEventTypes.PLAYER_CHECKED_IN);
        this.emit(OnChainEventTypes.PLAYER_CHECKED_IN, { address: event.data.sender_addr });
        break;
      case contractShuffleEventType:
        console.log("publishing", OnChainEventTypes.SHUFFLED_DECK);
        this.emit(OnChainEventTypes.SHUFFLED_DECK, { address: event.data.sender_addr });
        break;
      case contractCardDecryptionShareEventType:
        console.log("publishing", OnChainEventTypes.CARDS_SHARES_RECEIVED);
        this.emit(OnChainEventTypes.CARDS_SHARES_RECEIVED, {
          address: event.data.sender_addr,
        });
        break;
      case contractSmallBlindEventType:
        console.log("publishing", OnChainEventTypes.PLAYER_PLACED_BET);
        this.emit(OnChainEventTypes.PLAYER_PLACED_BET, {
          action: BettingActions.SMALL_BLIND,
        });
        break;
      case contractBigBlindEventType:
        console.log("publishing", OnChainEventTypes.PLAYER_PLACED_BET);
        this.emit(OnChainEventTypes.PLAYER_PLACED_BET, {
          action: BettingActions.BIG_BLIND,
        });
        break;
      case contractFoldEventType:
        console.log("publishing", OnChainEventTypes.PLAYER_PLACED_BET);
        this.emit(OnChainEventTypes.PLAYER_PLACED_BET, {
          action: BettingActions.FOLD,
          address: event.data.sender_addr,
        });
        break;
      case contractRaiseEventType:
        console.log("publishing", OnChainEventTypes.PLAYER_PLACED_BET);
        this.emit(OnChainEventTypes.PLAYER_PLACED_BET, {
          action: BettingActions.RAISE,
          address: event.data.sender_addr,
        });
        break;
      case contractCallEventType:
        console.log("publishing", OnChainEventTypes.PLAYER_PLACED_BET);
        this.emit(OnChainEventTypes.PLAYER_PLACED_BET, {
          action: BettingActions.CALL,
          address: event.data.sender_addr,
        });
        break;
    }
  }

  private pollTableEvents = async (tableId: string) => {
    const events = await queryEvents(tableId);
    const lastEventIndex = this.pollingTables[tableId]!.lastEventBlockHeight;
    if (lastEventIndex) {
      const newEvents = events
        .filter((ev) => ev.transaction_block_height > lastEventIndex)
        .sort((a, b) => a.transaction_block_height - b.transaction_block_height);
      if (newEvents.length > 0) console.log("new events are", newEvents);
      for (const event of newEvents) {
        this.publishEvent(event);
      }
    }
    // TODO: parse events and emit
    const pollingTable = this.pollingTables[tableId];
    if (pollingTable) {
      pollingTable.lastEventBlockHeight = events[0].transaction_block_height;
      pollingTable.timerId = setTimeout(this.pollTableEvents.bind(this, tableId), POLLING_INTERVAL);
    }
  };

  public listenToTableEvents(tableId: string) {
    console.log("listen to events", tableId);
    if (this.pollingTables[tableId]) return;
    const timerId = setTimeout(this.pollTableEvents.bind(this, tableId), POLLING_INTERVAL);
    this.pollingTables[tableId] = { timerId: timerId };
  }

  public disregardTableEvents(tableId: string) {
    if (!this.pollingTables[tableId]) return;
    clearInterval(this.pollingTables[tableId]?.timerId);
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
    return await createTableObject(
      waitingTimeOut,
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
  }

  queryGameState(id: string): Promise<OnChainTableObject>;
  // TODO: partial query
  queryGameState<T extends keyof OnChainTableObject>(
    id: string,
    fields: T[],
  ): Promise<Pick<OnChainTableObject, T>>;
  async queryGameState<T extends keyof OnChainTableObject>(
    id: string,
    fields?: T[],
  ): Promise<Pick<OnChainTableObject, T>> {
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

  async shuffledDeck(tableId: string, outDeck: Uint8Array, proof: Uint8Array) {
    return await callShuffleEncryptDeck(
      this.address,
      outDeck,
      proof,
      tableId,
      this.singAndSubmitTransaction,
    );
  }

  async cardsDecryptionShares(
    tableId: string,
    cardDecryptionShares: Uint8Array[],
    proofs: Uint8Array[],
  ) {
    return await callDecryptCardShares(
      this.address,
      cardDecryptionShares,
      proofs,
      tableId,
      this.singAndSubmitTransaction,
    );
  }

  async Bet(tableId: string, action: PlacingBettingActions) {
    switch (action) {
      case PlacingBettingActions.FOLD:
        return await callFoldContract(this.address, tableId, this.singAndSubmitTransaction);
      case PlacingBettingActions.RAISE:
        return await callRaiseContract(this.address, tableId, this.singAndSubmitTransaction);
      case PlacingBettingActions.CHECK_CALL:
        return await callCallContract(this.address, tableId, this.singAndSubmitTransaction);
    }
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
