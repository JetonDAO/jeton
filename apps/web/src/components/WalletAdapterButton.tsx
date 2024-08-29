"use client";
import { WalletConnector as MuiWalletSelector } from "@aptos-labs/wallet-adapter-mui-design";
import { WalletName, useWallet } from "@aptos-labs/wallet-adapter-react";

export default function WalletAdapterButton() {
  const { connect, disconnect, account, connected } = useWallet();
  if (connected) return <div>{account?.address}</div>;
  return (
    <div>
      <MuiWalletSelector />
    </div>
  );
}
