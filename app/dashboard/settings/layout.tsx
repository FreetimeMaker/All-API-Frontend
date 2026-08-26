import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your All API account settings and session.",
  robots: { index: false, follow: false },
};

export default function SettingsMetaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
