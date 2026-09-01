import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Status",
  description: "Real-time health check and service status for All API.",
  robots: { index: true, follow: true },
};

export default function HealthLayout({ children }: { children: React.ReactNode }) {
  return children;
}
