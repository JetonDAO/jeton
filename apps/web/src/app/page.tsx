export const runtime = "edge";

import WalletAdapterButton from "@src/components/WalletAdapterButton";

export default function Home() {
  return (
    <div className="text-center">
      <div> Welcome to Jeton DAO</div>
      <WalletAdapterButton />
    </div>
  );
}
