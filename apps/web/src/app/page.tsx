import LoginButton from "./component/LoginButton";

export const runtime = "edge";

export default function Home() {
  return (
    <div className="text-center">
      <div> Welcome to Jeton DAO</div>
      <LoginButton />
    </div>
  );
}
