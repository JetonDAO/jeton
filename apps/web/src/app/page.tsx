import Link from "next/link";

export const runtime = "edge";

export default function Home() {
  return (
    <div className="text-center">
      <div> Welcome to Jeton DAO</div>
      <Link href="/login">Login here</Link>
    </div>
  );
}
