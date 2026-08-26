import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse and purchase Freetime Maker products. Pay securely with Solana.",
  robots: { index: false, follow: false },
};

export default function ShopMetaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
