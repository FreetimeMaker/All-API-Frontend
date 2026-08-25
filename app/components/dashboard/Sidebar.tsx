"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { name: "Übersicht", href: "/dashboard", icon: "📊" },
  { name: "Statistiken", href: "/dashboard/stats", icon: "📈" },
  { name: "Profil", href: "/dashboard/profile", icon: "👤" },
  { name: "Einstellungen", href: "/dashboard/settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-[calc(100vh-64px)] hidden md:block">
      <nav className="p-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm text-slate-300">Betriebsbereit</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
