import { Game, type GameOptions } from "@src/Game";
import { PieSocketTransport } from "@src/transport";

export function createGame(
  options: Partial<Omit<GameOptions, "tableId">> & Pick<GameOptions, "tableId">,
) {
  const finalOptions: GameOptions = {
    ...options,
    offChainTransport: options.offChainTransport || new PieSocketTransport(),
  };
  return new Game(finalOptions);
}
