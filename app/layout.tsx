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
  metadataBase: new URL("https://all-api.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "All API",
    title: "All API — Freetime Maker",
    description: "Manage GeoWeather subscriptions and API access from one dashboard. Pay with Solana.",
  },
  twitter: {
    card: "summary_large_image",
    title: "All API — Freetime Maker",
    description: "Manage GeoWeather subscriptions and API access from one dashboard. Pay with Solana.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "IMtNCgqkckGhncM3VQd7zLDqqLYF6jVcX9PFHNDrPRs",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-K0VZ03Y0TX"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-K0VZ03Y0TX');
        `}
      </Script>
      <body className="min-h-full flex flex-col bg-slate-950">
        <header className="w-full bg-slate-900 border-b border-slate-800 py-3 px-6">
          <AuthNav />
        </header>
        <main className="flex-1">{children}</main>
        <footer className="w-full bg-slate-900 border-t border-slate-800 py-4 px-6 text-center">
          <p className="text-xs text-slate-500">&copy; 2026 Freetime Maker</p>
        </footer>
      </body>
    </html>
  );
}
