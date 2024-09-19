"use client";

import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import buttonBackground from "@src/assets/images/button.png";
import background from "@src/assets/images/main-menu-background.png";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export const runtime = "edge";

export default function Home() {
  const { connected, disconnect, isLoading } = useWallet();
  const [openModal, setOpenModal] = useState(false);

  const options = [
    {
      label: "Create game",
      url: "/create",
    },
    {
      label: "Join game",
      url: "/join",
    },
    {
      label: "Jeton homepage",
      url: "/",
    },
  ];

  return (
    <div className="relative overflow-hidden items-center flex min-h-screen">
      <Image
        width={80}
        height={80}
        className="w-40 aspect-square absolute bottom-5 right-5"
        src="/images/logo.png"
        style={{ imageRendering: "pixelated" }}
        alt="Logo"
      />
      <div className="text-center bg-paarl-600 flex animate-slide-in h-[50dvh] flex-col items-center rounded-r-3xl px-8 py-8 bg-opacity-90 relative overflow-hidden z-50 justify-center max-w-md">
        <div className="flex flex-col gap-5 relative z-20">
          {connected ? (
            options.map((btn) => (
              <Link
                href={btn.url}
                key={btn.url}
                style={{ backgroundImage: buttonBackground.src }}
                className="relative w-72 h-14 p-4 flex justify-center items-center z-10 hover:brightness-110 shadow-2xl active:scale-95 rounded-lg duration-150 nes-btn is-warning !bg-amber-500"
              >
                {btn.label}
              </Link>
            ))
          ) : (
            <p className="text-red-100 text-xl">
              Please connect your wallet to create or join a game.
            </p>
          )}

          {/* Custom Connect Wallet Button */}
          {!connected && (
            <>
              <div className="invisible absolute">
                <WalletSelector setModalOpen={setOpenModal} isModalOpen={openModal} />
              </div>

              <button
                className={`relative w-72 mx-auto h-14 p-4 flex justify-center items-center z-10 hover:brightness-110 shadow-2xl active:scale-95 rounded-lg duration-150 nes-btn is-warning !bg-amber-500 ${
                  isLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={() => setOpenModal(true)}
                disabled={isLoading}
                style={{ backgroundImage: buttonBackground.src }}
              >
                {isLoading ? "Connecting..." : "Connect Wallet"}
              </button>
            </>
          )}

          {connected && (
            <button
              className="relative w-72 h-14 p-4 flex justify-center items-center z-10 hover:brightness-110 shadow-2xl active:scale-95 rounded-lg duration-150 nes-btn is-warning !bg-amber-500"
              onClick={disconnect}
              style={{ backgroundImage: buttonBackground.src }}
            >
              Disconnect Wallet
            </button>
          )}
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
    </div>
  );
}
