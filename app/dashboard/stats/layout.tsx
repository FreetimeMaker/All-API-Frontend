import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Statistics",
  description: "API health stats, product overview and authentication details.",
  robots: { index: false, follow: false },
};

export default function StatsMetaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
