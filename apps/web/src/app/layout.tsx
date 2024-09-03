import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";

import "./globals.css";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";

import "@jeton/ui/styles.css";
import { WalletProvider } from "../components/WalletProvider";

const pressStart2P = Press_Start_2P({
  weight: "400",
  style: "normal",
  display: "swap",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jeton DAO",
  description:
    "Decentralized poker protocol enabling trustless, transparent, and community-governed gameplay",
};

export default function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={pressStart2P.className}>
        <WalletProvider>
          <div
            className={`relative bg-[url("/images/wood-pattern.png")] bg-repeat bg-center bg-[length:200px_200px] min-h-screen z-50 flex items-center justify-center`}
          >
            <div className="w-full flex max-w-[2400px] aspect-video max-h-screen rounded-2xl flex-col relative items-center justify-center py-2 -z-40">
              <div>{children}</div>
              <div>{modal}</div>
            </div>
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
