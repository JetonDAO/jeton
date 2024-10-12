"use client";

import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { createZkDeck } from "@jeton/ts-sdk";
import buttonBackground from "@src/assets/images/button.png";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
import { useState } from "react";
import DownloadModal from "./[id]/components/DownloadModal";

import { decryptCardShareZkey, shuffleEncryptDeckZkey } from "@jeton/zk-deck";
//@ts-ignore
import decryptCardShareWasm from "@jeton/zk-deck/wasm/decrypt-card-share.wasm";
//@ts-ignore
import shuffleEncryptDeckWasm from "@jeton/zk-deck/wasm/shuffle-encrypt-deck.wasm";
import { setProgress } from "./[id]/state/actions/gameActions";

export const runtime = "edge";

export default function Home() {
  const { connected, disconnect, isLoading } = useWallet();
  const [openModal, setOpenModal] = useState(false);
  const [downloadingAssets, setDownloadingAssets] = useState(true);
  const startedDownloadingRef = useRef(false);

  useEffect(() => {
    if (!startedDownloadingRef.current) {
      startedDownloadingRef.current = true;
      createZkDeck(
        {
          decryptCardShareWasm,
          shuffleEncryptDeckWasm,
          decryptCardShareZkey,
          shuffleEncryptDeckZkey,
        },
        ({ percentage }) => {
          setProgress(percentage);
        },
      ).then(() => {
        setDownloadingAssets(false);
      });
    }
  }, []);

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

  if (downloadingAssets) return <DownloadModal />;

  return (
    <div className="relative overflow-hidden items-center flex min-h-screen">
      <Image
        quality={50}
        width={80}
        height={80}
        className="w-24 aspect-square absolute bottom-5 right-5 duration-500 animate-grow-in"
        src="/images/logo.png"
        draggable={false}
        style={{ imageRendering: "pixelated" }}
        alt="Logo"
        priority
      />
      <div
        className={`text-center flex animate-slide-in flex-col items-center rounded-r-3xl px-8 py-8 bg-opacity-90 duration-1000 relative overflow-hidden z-50 justify-center max-w-md bg-[url("/images/wood-pattern-light.png")] bg-repeat bg-center bg-[length:200px_200px] border-8 shadow border-[#b87d5b] transition-all ${
          connected ? "max-h-full" : "max-h-96"
        }`}
      >
        <div className="flex flex-col gap-5 relative z-20 duration-500 w-full">
          {connected ? (
            <>
              {options.map((btn) => (
                <Link
                  prefetch
                  href={btn.url}
                  key={btn.url}
                  className="relative w-72 h-14 p-4 flex justify-center items-center z-10 hover:brightness-110 shadow-2xl active:scale-95 rounded-lg duration-150 nes-btn is-warning !bg-amber-500 animate-grow-in"
                >
                  {btn.label}
                </Link>
              ))}
              <button
                className="relative w-72 h-14 p-4 mt-20 flex  whitespace-nowrap text-sm justify-center items-center z-10 hover:brightness-110 shadow-2xl active:scale-95 rounded-lg duration-150 nes-btn is-error animate-grow-in"
                onClick={disconnect}
              >
                Disconnect Wallet
              </button>
            </>
          ) : (
            <>
              <p className="text-white text-xl">
                Please connect your wallet to create or join a game.
              </p>
              <div className="invisible absolute">
                <WalletSelector setModalOpen={setOpenModal} isModalOpen={openModal} />
              </div>

              <button
                className={`relative w-72 mx-auto h-14 p-4 flex justify-center items-center z-10 hover:brightness-110 shadow-2xl active:scale-95 rounded-lg duration-150 nes-btn ${
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
        </div>
      </div>
    </div>
  );
}
