export const runtime = "edge";

import WalletAdapterButton from "@src/components/WalletAdapterButton";

export default function Login() {
  return (
    <div className="text-center mt-[50vh]">
      <WalletAdapterButton />
    </div>
  );
}
