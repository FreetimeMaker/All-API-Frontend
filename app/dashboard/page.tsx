"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const AUTH_KEYS = ['access_token', 'auth_code', 'auth_token', 'token_type', 'token_expires_at', 'user_info'];

  function clearAuth() {
    AUTH_KEYS.forEach(k => localStorage.removeItem(k));
  }

  useEffect(() => {
    const expiresAt = localStorage.getItem('token_expires_at');
    if (expiresAt && Date.now() > Number(expiresAt)) {
      clearAuth();
      router.push("/login");
      return;
    }

    const accessToken = localStorage.getItem('access_token');
    const authCode = localStorage.getItem('auth_code');
    const userToken = localStorage.getItem('auth_token');
    const tokenToUse = accessToken || authCode || userToken;

    if (!tokenToUse) {
      router.push("/login");
      return;
    }

    fetch("/api/session", {
      headers: {
        'Authorization': `Bearer ${tokenToUse}`,
        'x-access-token': tokenToUse,
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn && data.user) {
          setUser(data.user);
        } else {
          clearAuth();
          router.push("/login");
        }
      })
      .catch(() => {
        clearAuth();
        router.push("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    try {
      clearAuth();
      await fetch("/api/proxy/api/v1/auth/logout", { method: "POST" });
    } catch (_) {
      clearAuth();
    }
    router.push("/login");
  }

  if (loading) {
    return <div className="p-8 text-slate-300">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect
  }

  const accountStats = [
    { title: "Account Status", value: "Active", change: "Verified", icon: "🛡️" },
    { title: "Last Login", value: "Today", change: "2h ago", icon: "🕒" },
    { title: "Security", value: "High", change: "90%", icon: "🔐" },
    { title: "Connected Services", value: "GitHub", change: "1 Active", icon: "🔗" },
  ];

  return (
    <div className="space-y-6 bg-gradient-to-br from-slate-900 to-slate-950 min-h-screen p-6">
      <header className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-100">Account Overview</h1>
        <p className="text-slate-400">Welcome, {user?.name || user?.username || "User"}. Manage your personal account details and settings here.</p>
      </header>

      {/* Account Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
        {accountStats.map((stat, i) => (
          <div key={i} className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-emerald-900/50 text-emerald-400 border border-emerald-800">
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-400">{stat.title}</p>
              <p className="text-xl font-bold text-slate-100">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {/* Account Activity */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 shadow-sm">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h2 className="font-semibold text-slate-100">Account Activity</h2>
            <button className="text-xs text-indigo-400 hover:underline">View All</button>
          </div>
          <div className="p-4">
            <ul className="space-y-4">
              <li className="flex items-center gap-4 text-sm">
                <div className="h-8 w-8 rounded-full bg-emerald-900/50 flex items-center justify-center text-emerald-400 text-xs font-bold">
                  LG
                </div>
                <div className="flex-1">
                  <p className="text-slate-100 font-medium">Successful Login</p>
                  <p className="text-slate-400 text-xs">Chrome on macOS • Berlin, DE</p>
                </div>
                <span className="text-xs text-slate-500">2 hours ago</span>
              </li>
              <li className="flex items-center gap-4 text-sm">
                <div className="h-8 w-8 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-400 text-xs font-bold">
                  PR
                </div>
                <div className="flex-1">
                  <p className="text-slate-100 font-medium">Profile picture updated</p>
                  <p className="text-slate-400 text-xs">Synced from GitHub</p>
                </div>
                <span className="text-xs text-slate-500">Yesterday, 18:45</span>
              </li>
              <li className="flex items-center gap-4 text-sm">
                <div className="h-8 w-8 rounded-full bg-amber-900/50 flex items-center justify-center text-amber-400 text-xs font-bold">
                  SC
                </div>
                <div className="flex-1">
                  <p className="text-slate-100 font-medium">Security check performed</p>
                  <p className="text-slate-400 text-xs">No suspicious activity found</p>
                </div>
                <span className="text-xs text-slate-500">Aug 14, 2026</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Account Shortcuts */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm">
          <div className="p-4 border-b border-slate-700">
            <h2 className="font-semibold text-slate-100">Account Actions</h2>
          </div>
          <div className="p-4 flex flex-col gap-2">
            <a href="/dashboard/profile" className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors text-slate-300">
              👤 Edit Profile
            </a>
            <button className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors text-slate-300">
              🔒 Change Password
            </button>
            <button className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors text-slate-300">
              📧 Email Settings
            </button>
            <div className="mt-2 pt-2 border-t border-slate-700">
              <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-red-900/50 text-red-400 rounded-lg border border-slate-700 flex items-center gap-2 transition-colors">
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
