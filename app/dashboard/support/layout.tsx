import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  description: "Get help with All API, report issues, and contact me.",
  robots: { index: false, follow: false },
};

export default function SupportMetaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
