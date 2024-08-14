import type { Metadata } from "next";

import "./globals.css";
import "@jeton/ui/styles.css";

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
      <body>
        <div>{children}</div>
        <div>{modal}</div>
      </body>
    </html>
  );
}
