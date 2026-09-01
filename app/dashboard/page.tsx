"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { proxyImageUrl } from "@/lib/proxy-image";
import Landing from "@/app/components/Landing";
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

interface Wallpaper {
  id: string;
  name: string;
  description: string;
  cost: number;
  currency?: string;
  category: string;
  image_url: string;
}

interface Purchase {
  wallpaperId: string;
  name: string;
  cost: number;
  image_url: string;
  category: string;
  purchasedAt: string;
}

interface RedeemedCode {
  id: number;
  type: string;
  used_at: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [purchasedWallpapers, setPurchasedWallpapers] = useState<Wallpaper[]>([]);
  const [redeemedCodes, setRedeemedCodes] = useState<RedeemedCode[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    Promise.all([
      supabase.auth.getUser(),
      fetch("/api/health").then(r => r.json()),
      fetch("/api/proxy/v1/wallora/wallpapers").then(r => r.ok ? r.json() : null),
    ]).then(([authRes, healthRes, wallpapersRes]) => {
      if (!authRes.data.user) {
        setUser(null);
      } else {
        setUser(authRes.data.user);
        setHealth(healthRes);

        const purchases: Purchase[] = authRes.data.user.user_metadata?.purchases || [];
        console.log("User purchases:", purchases);
        if (purchases.length > 0) {
          // Create purchased wallpapers from purchase data directly
          const purchasedWallpapersData: Wallpaper[] = purchases.map((purchase: Purchase) => ({
            id: purchase.wallpaperId,
            name: purchase.name,
            description: `Purchased on ${new Date(purchase.purchasedAt).toLocaleDateString()}`,
            cost: purchase.cost,
            currency: "USD",
            category: purchase.category || "Purchased",
            image_url: purchase.image_url || ""
          }));
          setPurchasedWallpapers(purchasedWallpapersData);
        }

        supabase
          .from("geoweather_codes")
          .select("id, type, used_at")
          .eq("used_by", authRes.data.user.id)
          .eq("is_used", true)
          .order("used_at", { ascending: false })
          .then(({ data, error }: { data: { id: number; type: string; used_at: string }[] | null; error: { message: string } | null }) => {
            if (!error && data && data.length > 0) {
              setRedeemedCodes(data as RedeemedCode[]);
              if (!currentPlan && data.length > 0) {
                setCurrentPlan(data[0].type);
              }
            }
          })
          .catch(() => {});
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router, supabase]);

  if (loading) {
    return <div className="p-8 text-slate-300">Loading...</div>;
  }

  if (!user) return <Landing />;

  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email || "User";
  const provider = user.app_metadata?.provider || "unknown";

  const accountStats = [
    {
      title: "API Status",
      value: health?.ok ? "Operational" : "Down",
      change: health?.body?.service || "N/A",
      icon: "🛡️",
      color: health?.ok ? "emerald" : "red",
    },
    {
      title: "Current Plan",
      value: currentPlan ? currentPlan : "Free",
      change: currentPlan ? "Active" : "No plan",
      icon: "🌤️",
      color: "cyan",
    },
  ];

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-900 to-slate-950 min-h-screen p-6">
      <header className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-100">Account Overview</h1>
        <p className="text-slate-400">Welcome, {name}. Here&apos;s your Freetime Maker dashboard.</p>
      </header>

      {currentPlan && (
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-900/40 to-slate-800 rounded-xl border border-indigo-700/50 p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Current Plan</p>
                <p className="text-xl font-bold text-slate-100">{currentPlan}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-6xl mx-auto">
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
            </ul>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm">
          <div className="p-4 border-b border-slate-700">
            <h2 className="font-semibold text-slate-100">Quick Actions</h2>
          </div>
          <div className="p-4 flex flex-col gap-2">
            <a href="/shop" className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors text-slate-300">🛒 Shop</a>
            <a href="/dashboard/profile" className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors text-slate-300">👤 Edit Profile</a>
            <a href="/dashboard/settings" className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors text-slate-300">⚙️ Settings</a>
            <a href="/dashboard/support" className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors text-slate-300">💬 Support</a>
            <a href="/health" className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors text-slate-300">💓 System Status</a>
            <div className="mt-2 pt-2 border-t border-slate-700">
              <button onClick={async () => { await supabase.auth.signOut(); router.push("/login"); }} className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-red-900/50 text-red-400 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors">🚪 Sign Out</button>
            </div>
          </div>
        </div>
      </div>

      {(purchasedWallpapers.length > 0 || redeemedCodes.length > 0) && (
        <div className="max-w-6xl mx-auto space-y-4">
          {redeemedCodes.length > 0 && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm">
              <div className="p-4 border-b border-slate-700">
                <h2 className="font-semibold text-slate-100">Redeemed Codes</h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {redeemedCodes.map((code) => (
                    <div key={code.id} className="bg-slate-900 rounded-lg border border-slate-700 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-slate-100 capitalize">{code.type}</h3>
                          <p className="text-xs text-slate-400 mt-1">GeoWeather Subscription</p>
                        </div>
                        <span className="ml-2 shrink-0 px-2 py-0.5 text-[10px] font-medium rounded bg-emerald-900/50 text-emerald-400 border border-emerald-800">
                          Active
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-slate-500">Redeemed {new Date(code.used_at).toLocaleDateString()}</span>
                        <span className="text-[10px] text-emerald-400 font-medium">Code</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {purchasedWallpapers.length > 0 && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm">
              <div className="p-4 border-b border-slate-700">
                <h2 className="font-semibold text-slate-100">Purchased Wallpapers</h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {purchasedWallpapers.map((wallpaper) => (
                    <div key={wallpaper.id} className="bg-slate-900 rounded-lg border border-slate-700 p-4">
                      <div className="flex gap-3">
                        {wallpaper.image_url && (
                          <img
                            src={proxyImageUrl(wallpaper.image_url)}
                            alt={wallpaper.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-slate-100 truncate">{wallpaper.name}</h3>
                          <p className="text-xs text-slate-400 mt-1">{wallpaper.description}</p>
                        </div>
                        <span className="shrink-0 px-2 py-0.5 text-[10px] font-medium rounded bg-emerald-900/50 text-emerald-400 border border-emerald-800">
                          Owned
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-100">${wallpaper.cost}</span>
                        <span className="text-[10px] text-indigo-400 font-medium">Purchased</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
