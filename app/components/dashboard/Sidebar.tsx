"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: "📊" },
  { name: "Shop", href: "/shop", icon: "🛒" },
  { name: "Statistics", href: "/dashboard/stats", icon: "📈" },
  { name: "Profile", href: "/dashboard/profile", icon: "👤" },
  { name: "Settings", href: "/dashboard/settings", icon: "⚙️" },
  { name: "Support", href: "/dashboard/support", icon: "💬" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const [apiUp, setApiUp] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/health")
      .then(r => r.json())
      .then(d => setApiUp(d.ok === true))
      .catch(() => setApiUp(false));
  }, []);

  const navContent = (
    <>
      <nav className="p-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                isActive
                  ? "bg-indigo-900/50 text-indigo-300 font-medium"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-slate-800">
        <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">API Status</p>
          <div className="flex items-center gap-2 mt-1">
            {apiUp === null ? (
              <>
                <div className="h-2 w-2 rounded-full bg-slate-500 animate-pulse" />
                <span className="text-sm text-slate-400">Checking...</span>
              </>
            ) : apiUp ? (
              <>
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm text-slate-300">Operational</span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-sm text-red-400">Down</span>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-[calc(100vh-64px)] hidden md:flex md:flex-col">
        {navContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <span className="font-semibold text-lg text-slate-100">Navigation</span>
              <button
                onClick={onMobileClose}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
