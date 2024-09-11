"use client";

import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";

import { Network } from "@aptos-labs/ts-sdk";
import type { PropsWithChildren } from "react";

export const WalletProvider = ({ children }: PropsWithChildren) => {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      optInWallets={["Mizu Wallet", "Petra", "Continue with Google"]}
      dappConfig={{
        network: Network.TESTNET,
        mizuwallet: {
          manifestURL: `${window.origin}+/mizuwallet-connect-manifest.json`,
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
