"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";

import { Network } from "@aptos-labs/ts-sdk";
import type { PropsWithChildren } from "react";

export const WalletProvider = ({ children }: PropsWithChildren) => {
  const baseApiUrl = process.env.BASE_URL;

  //TODO network setup
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      optInWallets={["Mizu Wallet", "Petra", "Continue with Google"]}
      dappConfig={{
        network: Network.TESTNET,
        aptosConnectDappId: "b76e8b1d-3fe8-442a-b254-47b2dcff3f2a",
        mizuwallet: {
          manifestURL: `${baseApiUrl}+/mizuwallet-connect-manifest.json`,
        },
      }}
      onError={(error) => {
        console.log("error", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};
