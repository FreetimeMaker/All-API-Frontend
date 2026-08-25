"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface HealthData {
  ok: boolean;
  status: number;
  body: {
    status: string;
    service: string;
    timestamp: string;
    checks: Record<string, string>;
  } | null;
}

interface ProductsData {
  count: number;
  products: Array<{ id: number; name: string; price: number; currency: string; stock: number }>;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [products, setProducts] = useState<ProductsData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    Promise.all([
      supabase.auth.getUser(),
      fetch("/api/health").then(r => r.json()),
      fetch("/api/proxy/api/v1/fms/products").then(r => r.json()),
    ]).then(([authRes, healthRes, productsRes]) => {
      if (!authRes.data.user) {
        router.push("/login");
      } else {
        setUser(authRes.data.user);
        setHealth(healthRes);
        setProducts(productsRes);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router, supabase]);

  if (loading) {
    return <div className="p-8 text-slate-300">Loading...</div>;
  }

  if (!user) return null;

  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email || "User";
  const provider = user.app_metadata?.provider || "unknown";
  const accountAge = user.created_at
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const accountStats = [
    {
      title: "API Status",
      value: health?.ok ? "Operational" : "Down",
      change: health?.body?.service || "N/A",
      icon: "🛡️",
      color: health?.ok ? "emerald" : "red",
    },
    {
      title: "Account Provider",
      value: provider.charAt(0).toUpperCase() + provider.slice(1),
      change: "Verified",
      icon: "🔗",
      color: "emerald",
    },
    {
      title: "Shop Products",
      value: products?.count?.toString() || "0",
      change: products?.count ? `${products.count} Active` : "None",
      icon: "📦",
      color: "indigo",
    },
    {
      title: "Account Age",
      value: `${accountAge}d`,
      change: "Since signup",
      icon: "🕒",
      color: "sky",
    },
  ];

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-900 to-slate-950 min-h-screen p-6">
      <header className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-100">Account Overview</h1>
        <p className="text-slate-400">Welcome, {name}. Here&apos;s your Freetime Maker dashboard.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {accountStats.map((stat, i) => (
          <div key={i} className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-${stat.color}-900/50 text-${stat.color}-400 border border-${stat.color}-800`}>{stat.change}</span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-400">{stat.title}</p>
              <p className="text-xl font-bold text-slate-100">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 shadow-sm">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h2 className="font-semibold text-slate-100">Account Activity</h2>
            <a href="/dashboard/stats" className="text-xs text-indigo-400 hover:underline">View All</a>
          </div>
          <div className="p-4">
            <ul className="space-y-4">
              <li className="flex items-center gap-4 text-sm">
                <div className="h-8 w-8 rounded-full bg-emerald-900/50 flex items-center justify-center text-emerald-400 text-xs font-bold">LG</div>
                <div className="flex-1">
                  <p className="text-slate-100 font-medium">Successful Login</p>
                  <p className="text-slate-400 text-xs">Signed in via {provider}</p>
                </div>
                <span className="text-xs text-slate-500">Just now</span>
              </li>
              {health?.body && (
                <li className="flex items-center gap-4 text-sm">
                  <div className="h-8 w-8 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-400 text-xs font-bold">API</div>
                  <div className="flex-1">
                    <p className="text-slate-100 font-medium">Health Check</p>
                    <p className="text-slate-400 text-xs">{health.body.service} &mdash; {health.body.status}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${health.ok ? "bg-emerald-900/50 text-emerald-400" : "bg-red-900/50 text-red-400"}`}>
                    {health.ok ? "OK" : "Error"}
                  </span>
                </li>
              )}
              {products && products.count > 0 && (
                <li className="flex items-center gap-4 text-sm">
                  <div className="h-8 w-8 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-400 text-xs font-bold">SH</div>
                  <div className="flex-1">
                    <p className="text-slate-100 font-medium">Shop Products</p>
                    <p className="text-slate-400 text-xs">{products.count} product{products.count !== 1 ? "s" : ""} available</p>
                  </div>
                  <span className="text-xs text-slate-500">FMS</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm">
          <div className="p-4 border-b border-slate-700">
            <h2 className="font-semibold text-slate-100">Quick Actions</h2>
          </div>
          <div className="p-4 flex flex-col gap-2">
            <a href="/dashboard/profile" className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors text-slate-300">👤 Edit Profile</a>
            <a href="/dashboard/settings" className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors text-slate-300">⚙️ Settings</a>
            <a href="/dashboard/stats" className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors text-slate-300">📈 Statistics</a>
            <a href="/health" className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors text-slate-300">💓 System Status</a>
            <div className="mt-2 pt-2 border-t border-slate-700">
              <button onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }} className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-red-900/50 text-red-400 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors">🚪 Sign Out</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
