import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Out",
  description: "Sign out of your All API account.",
  robots: { index: false, follow: false },
};

export default function LogoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
