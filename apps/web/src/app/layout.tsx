import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";

import "./globals.css";
import "@jeton/ui/styles.css";

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
        <div className="relative bg-[#958b6f] min-h-screen z-50 flex items-center justify-center">
          <div className="w-full flex max-w-[2400px] aspect-video max-h-screen rounded-2xl flex-col relative items-center justify-center py-2 -z-40">
            <div>{children}</div>
            <div>{modal}</div>
          </div>
        </div>
      </body>
    </html>
  );
}
