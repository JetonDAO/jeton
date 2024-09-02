import WalletAdapterButton from "../components/WalletAdapterButton";

export const runtime = "edge";

export default function Home() {
  return (
    <div className="text-center">
      <div> Welcome to Jeton DAO</div>
      <WalletAdapterButton />
    </div>
  );
}
