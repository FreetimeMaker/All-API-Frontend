"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: "📊" },
  { name: "Shop", href: "/shop", icon: "🛒" },
  { name: "Statistics", href: "/dashboard/stats", icon: "📈" },
  { name: "Profile", href: "/dashboard/profile", icon: "👤" },
  { name: "Settings", href: "/dashboard/settings", icon: "⚙️" },
  { name: "Support", href: "/dashboard/support", icon: "💬" },
  { name: "Developer Portal", href: "/dashboard/developer", icon: "🛠️" },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [apiUp, setApiUp] = useState<boolean | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then(r => r.json())
      .then(d => setApiUp(d.ok === true))
      .catch(() => setApiUp(false));
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await supabase.auth.signOut();
      onMobileClose?.();
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "User";
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;
  const initials = String(name)
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const navContent = (
    <>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3 sm:p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-indigo-900/50 font-medium text-indigo-300"
                  : "text-slate-300 hover:bg-slate-800 active:bg-slate-700"
              }`}
            >
              <span className="shrink-0 text-base" aria-hidden="true">{item.icon}</span>
              <span className="min-w-0 truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-3 sm:p-4">
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-3">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">API Status</p>
          <div className="mt-1 flex items-center gap-2">
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

  const mobileAccount = user && (
    <div className="border-t border-slate-800 p-3 sm:p-4 md:hidden">
      <Link
        href="/dashboard/profile"
        onClick={onMobileClose}
        className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/70 p-3 transition-colors hover:bg-slate-800 active:bg-slate-700"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={`${name} profile`} className="h-10 w-10 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-slate-200">
            {initials || "U"}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-100">{name}</p>
          <p className="truncate text-xs text-slate-400">View profile</p>
        </div>
        <span className="text-slate-500" aria-hidden="true">›</span>
      </Link>

      <button
        type="button"
        onClick={handleLogout}
        disabled={loggingOut}
        className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-red-800/60 bg-red-950/40 px-4 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-900/50 active:bg-red-900/70 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span aria-hidden="true">↪</span>
        {loggingOut ? "Logging out…" : "Logout"}
      </button>
    </div>
  );

  return (
    <>
      <aside className="hidden min-h-[calc(100vh-64px)] w-64 flex-col border-r border-slate-800 bg-slate-900 md:flex">
        {navContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 h-full w-full bg-black/65"
            onClick={onMobileClose}
            aria-label="Close navigation menu"
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(86vw,20rem)] flex-col border-r border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-3 sm:p-4">
              <span className="truncate text-lg font-semibold text-slate-100">Navigation</span>
              <button
                onClick={onMobileClose}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 active:bg-slate-700"
                aria-label="Close menu"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {navContent}
            {mobileAccount}
          </aside>
        </div>
      )}
    </>
  );
}
