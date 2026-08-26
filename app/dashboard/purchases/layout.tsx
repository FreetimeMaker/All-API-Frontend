import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Purchases",
  description: "View and manage your purchased Freetime Maker products.",
  robots: { index: false, follow: false },
};

export default function PurchasesMetaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
