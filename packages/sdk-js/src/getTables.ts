import type { Table } from "@src/types/Table";

/**
 * should read different table parameters (probably from a contract) and return a list of them
 * @returns {Table[]}
 */
export const getTables = async (): Promise<Table[]> => {
  return [
    { id: "tb0", game: "Texas Hold'em", buyIn: 1000, stake: 2000 },
    { id: "tb1", game: "Texas Hold'em", buyIn: 2000, stake: 4000 },
  ];
};
