import Link from "next/link";
import WalletAdapterButton from "../components/WalletAdapterButton";

export const runtime = "edge";

export default function Home() {
  return (
    <div className="text-center">
      <div> Welcome to Jeton DAO</div>
      <Link href="/login">Login here</Link>
      <WalletAdapterButton />
    </div>
  );
}
