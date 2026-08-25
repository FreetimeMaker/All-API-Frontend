import type { Metadata } from "next";
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
  title: "Freetime Maker",
  description: "Manage all Freetime Maker products from one account.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
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
