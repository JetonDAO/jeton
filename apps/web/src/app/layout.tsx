import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";

import "./globals.css";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";

import "@jeton/ui/styles.css";
import { WalletProvider } from "@src/components/WalletProvider";

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
          {children}
          <div>{modal}</div>
        </WalletProvider>
      </body>
    </html>
  );
}
