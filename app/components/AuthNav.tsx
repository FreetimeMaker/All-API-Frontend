"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Spinner from "./Spinner";
import type { User } from "@supabase/supabase-js";

export default function AuthNav() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [healthStatus, setHealthStatus] = useState<"ok" | "error" | "loading">("loading");
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: import("@supabase/supabase-js").User | null } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: { user: import("@supabase/supabase-js").User } | null) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    fetch("/api/health")
      .then((res) => setHealthStatus(res.ok ? "ok" : "error"))
      .catch(() => setHealthStatus("error"));
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "User";
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || null;

  return (
    <nav className="max-w-4xl mx-auto flex items-center justify-between py-2">
      <div className="flex items-center gap-4">
            <Link href="/dashboard" className="font-semibold text-lg text-slate-100">All API</Link>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-medium uppercase tracking-wider text-slate-400">
          <div className={`h-2 w-2 rounded-full ${healthStatus === "ok" ? "bg-emerald-500" : healthStatus === "error" ? "bg-red-500" : "bg-amber-400 animate-pulse"}`} />
          API {healthStatus === "ok" ? "Online" : healthStatus === "error" ? "Offline" : "Checking"}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {loading ? (
          <div className="flex items-center gap-2">
            <Spinner />
            <span className="text-sm text-slate-400">Checking login...</span>
          </div>
        ) : user ? (
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors">Dashboard</a>
            <a href="/shop" className="text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors">Shop</a>
            <a href="/sol-arcade" className="text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors">Arcade</a>
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <img src={avatarUrl} alt={`${name} profile`} className="h-8 w-8 rounded-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div aria-hidden className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium text-slate-300">
                  {name.split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase()}
                </div>
              )}
              <span className="text-sm text-slate-200">{name}</span>
              <button onClick={handleLogout} className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700 transition-colors">Logout</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <a href="/sol-arcade" className="text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors">Arcade</a>
            <a href="/login" className="px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors">Login</a>
          </div>
        )}
      </div>
    </nav>
  );
}
