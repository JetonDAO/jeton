"use client";

import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export default function WalletAdapterButton() {
  const { connect, disconnect, account, connected, isLoading } = useWallet();
  if (connected)
    return (
      <button className="text-white bg-yellow-900 py-5" onClick={disconnect}>
        Disconnect wallet
      </button>
    );
  if (isLoading) return <div className="text-white">is Loading</div>;
  return (
    <div>
      <WalletSelector />
    </div>
  );
}
