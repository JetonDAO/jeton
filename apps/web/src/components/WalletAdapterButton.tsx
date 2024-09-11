"use client";

import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export default function WalletAdapterButton() {
  const { connect, disconnect, account, connected, isLoading } = useWallet();
  if (connected) return <button onClick={disconnect}>Disconnect</button>;
  if (isLoading) return <div>is Loading</div>;
  return (
    <div>
      <WalletSelector />
    </div>
  );
}
