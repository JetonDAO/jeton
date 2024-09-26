import { Game, type GameConfigs } from "@src/Game";
import { PieSocketTransport } from "@src/transport";
import { OnChainDataSource } from "./OnChainDataSource";

export function createGame(
  options: Partial<
    Omit<
      GameConfigs,
      "tableInfo" | "signMessage" | "signAndSubmitTransaction" | "address" | "zkDeckFilesOrUrls"
    >
  > &
    Pick<
      GameConfigs,
      "tableInfo" | "signMessage" | "signAndSubmitTransaction" | "address" | "zkDeckFilesOrUrls"
    >,
) {
  const finalOptions: GameConfigs = {
    ...options,
    offChainTransport: options.offChainTransport || new PieSocketTransport(),
    onChainDataSource: options.onChainDataSource || new OnChainDataSource(),
  };
  return new Game(finalOptions);
}
