import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscriptions",
  description: "Manage your GeoWeather subscriptions. Choose a plan or redeem a code.",
  robots: { index: false, follow: false },
};

export default function SubscriptionsMetaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
