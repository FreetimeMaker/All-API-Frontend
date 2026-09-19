import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthNav from "./components/AuthNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "All API — Freetime Maker",
    template: "%s | All API",
  },
  description: "Manage GeoWeather subscriptions and API access from one dashboard. Pay with Solana.",
  metadataBase: new URL("https://dashboard.free-time.me"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "All API Dashboard",
    title: "All API — Freetime Maker",
    description: "Manage GeoWeather subscriptions and API access from one dashboard. Pay with Solana.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950">
        <header className="liquid-glass-topbar sticky top-0 z-50 w-full border-b px-6 py-3">
          <AuthNav />
        </header>
        <main className="flex-1">{children}</main>
        <footer className="liquid-glass-footer w-full border-t py-4 px-6 text-center">
          <p className="text-xs text-slate-500">&copy; 2026 Freetime Maker</p>
        </footer>
      </body>
    </html>
  );
}
