"use client";

import background from "@src/assets/images/main-menu-background.png";
import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import Image from "next/image";
import Script from "next/script";

import "./globals.css";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";

import "@jeton/ui/styles.css";
import { LayoutTransition } from "@src/components/LayoutTransition";
import SoundSettings from "@src/components/SoundSettings";
import { WalletProvider } from "@src/components/WalletProvider";
import { useButtonClickSound } from "@src/hooks/useButtonClickSound";

const pressStart2P = Press_Start_2P({
  weight: "400",
  style: "normal",
  display: "swap",
  subsets: ["latin"],
});

// export const metadata: Metadata = {
//   title: "Jeton DAO",
//   description:
//     "Decentralized poker protocol enabling trustless, transparent, and community-governed gameplay",
// };

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  useButtonClickSound();

  return (
    <html lang="en">
      <body className={pressStart2P.className}>
        <WalletProvider>
          <LayoutTransition initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {children}
          </LayoutTransition>
          <Image
            quality={20}
            className="w-full h-full object-cover absolute top-0 left-0 -z-40"
            src={background}
            alt="background"
            priority
            style={{
              imageRendering: "pixelated",
            }}
          />
          <SoundSettings />

          {modal}
        </WalletProvider>
        <Script src="/register-service-worker.js" />
      </body>
    </html>
  );
}
