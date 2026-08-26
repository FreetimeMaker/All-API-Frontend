import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "View your All API profile and account details.",
  robots: { index: false, follow: false },
};

export default function ProfileMetaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
