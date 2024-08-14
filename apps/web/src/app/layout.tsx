import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Jeton DAO",
  description:
    "Decentralized poker protocol enabling trustless, transparent, and community-governed gameplay",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
