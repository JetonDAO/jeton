"use client";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export default function WalletAdapterButton() {
  const { account, connected, isLoading } = useWallet();
  if (connected) return <div>{account?.address}</div>;
  if (isLoading) return <div>is Loading</div>;
  return (
    <div>
      <WalletSelector />
    </div>
  );
}
