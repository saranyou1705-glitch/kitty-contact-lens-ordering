export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import "./globals.css";
import CustomerNavigation from "./customer-navigation";

export const metadata: Metadata = {
  title: "Kitty Kawaii Ordering",
  description: "ระบบสั่งซื้อคอนแทคเลนส์ Kitty Kawaii",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>
        <CustomerNavigation />
        <div className="min-h-screen pb-24">{children}</div>
      </body>
    </html>
  );
}
