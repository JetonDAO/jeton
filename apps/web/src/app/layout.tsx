import type { Metadata } from "next";

import "./globals.css";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";

import "@jeton/ui/styles.css";
import { WalletProvider } from "@src/components/WalletProvider";

export const metadata: Metadata = {
  title: "Jeton DAO",
  description: "Decentralized poker protocol enabling trustless, transparent, and community-governed gameplay",
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
      <body>
        <WalletProvider>
          <div>{children}</div>
          <div>{modal}</div>
        </WalletProvider>
      </body>
    </html>
  );
}
