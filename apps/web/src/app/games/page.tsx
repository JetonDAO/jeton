"use client";

import { useWallet } from "@aptos-labs/wallet-adapter-react";
import buttonBackground from "@src/assets/images/button.png";
import background from "@src/assets/images/main-menu-background.png";
import WalletAdapterButton from "@src/components/WalletAdapterButton";
import Image from "next/image";
import Link from "next/link";
export const runtime = "edge";

export default function Home() {
  const options = [
    {
      id: 1,
      label: "Play",
      url: "/setup",
    },
    {
      id: 2,
      label: "Settings",
      url: "/",
    },
  ];

  return (
    <>
      <div className="text-center bg-orange-300 flex flex-col items-center rounded-lg px-8 py-8 bg-opacity-75">
        <h1 className="text-2xl text-orange-800 font-bold mb-4">Welcome to Jeton</h1>
        <p className="mb-8 text-orange-700">Best Opportunity to lose your money</p>
        <div className="flex flex-col gap-5 relative z-20">
          {options.map((btn) => (
            <Link
              href={btn.url}
              key={btn.id}
              style={{ backgroundImage: buttonBackground.src }}
              className="relative w-72 h-14 p-4 flex justify-center items-center z-10 hover:brightness-110 shadow-2xl active:scale-95 rounded-lg duration-150"
            >
              <Image
                src={buttonBackground}
                alt="Button Background"
                className="w-full absolute left-0 top-0 -z-10 object-cover h-full"
              />
              <span className="text-white">{btn.label}</span>
            </Link>
          ))}
          <WalletAdapterButton />
        </div>
      </div>
      <Image
        className="w-full h-full object-cover absolute top-0 left-0 -z-40"
        src={background}
        alt="background"
        priority
        style={{
          imageRendering: "pixelated",
        }}
      />
    </>
  );
}
