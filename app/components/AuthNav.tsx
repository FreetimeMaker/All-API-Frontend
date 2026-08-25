"use client";
import React, { useEffect, useState } from "react";
import Spinner from "./Spinner";

export default function AuthNav() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [healthStatus, setHealthStatus] = useState<"ok" | "error" | "loading">("loading");

  async function checkHealth() {
    try {
      const res = await fetch("/api/health");
      setHealthStatus(res.ok ? "ok" : "error");
    } catch {
      setHealthStatus("error");
    }
  }

  const AUTH_KEYS = ['access_token', 'auth_code', 'auth_token', 'token_type', 'token_expires_at', 'user_info'];

  function clearAuth() {
    AUTH_KEYS.forEach(k => localStorage.removeItem(k));
  }

  async function fetchSession() {
    setLoading(true);
    setError(null);
    try {
      const expiresAt = localStorage.getItem('token_expires_at');
      if (expiresAt && Date.now() > Number(expiresAt)) {
        clearAuth();
        setLoggedIn(false);
        setUser(null);
        setLoading(false);
        return;
      }

      const accessToken = localStorage.getItem('access_token');
      const authCode = localStorage.getItem('auth_code');
      const userToken = localStorage.getItem('auth_token');
      const tokenToUse = accessToken || authCode || userToken;

      if (!tokenToUse) {
        setLoggedIn(false);
        setUser(null);
        setLoading(false);
        return;
      }

      const headers: HeadersInit = {
        'Authorization': `Bearer ${tokenToUse}`,
        'x-access-token': tokenToUse,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch("/api/session", {
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`status ${res.status}`);
      const j = await res.json();

      if (j?.loggedIn) {
        setLoggedIn(true);
        setUser(j?.user ?? null);
      } else {
        clearAuth();
        setLoggedIn(false);
        setUser(null);
      }
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
      setLoggedIn(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkHealth();
    fetchSession();
  }, []);

  async function handleLogout() {
    try {
      clearAuth();
      await fetch("/api/proxy/api/v1/auth/logout", { method: "POST" });
      await fetchSession();
    } catch (_) {
      clearAuth();
      await fetchSession();
    }
  }

  return (
    <nav className="max-w-4xl mx-auto flex items-center justify-between py-2">
      <div className="flex items-center gap-4">
        <a href="/" className="font-semibold text-lg text-slate-100">All API Frontend</a>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-medium uppercase tracking-wider text-slate-400">
          <div className={`h-2 w-2 rounded-full ${healthStatus === 'ok' ? 'bg-emerald-500' : healthStatus === 'error' ? 'bg-red-500' : 'bg-amber-400 animate-pulse'}`} />
          API {healthStatus === 'ok' ? 'Online' : healthStatus === 'error' ? 'Offline' : 'Checking'}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {loading ? (
          <div className="flex items-center gap-2">
            <Spinner />
            <span className="text-sm text-slate-400">Checking login…</span>
          </div>
        ) : error ? (
          <span className="text-sm text-red-400">Error checking session</span>
        ) : loggedIn ? (
          <div className="flex items-center gap-4">
            <a href="/dashboard" className="text-sm font-medium text-slate-300 hover:text-indigo-400 transition-colors">Dashboard</a>
            <div className="flex items-center gap-3">
              {(() => {
                const avatarUrl =
                  user?.avatar ||
                  user?.avatar_url ||
                  user?.picture ||
                  user?.image ||
                  user?.avatarUrl ||
                  user?.profile_image_url ||
                  null;

                const name = user?.name || user?.username || "User";

                if (avatarUrl) {
                  // eslint-disable-next-line @next/next/no-img-element
                  return <img src={avatarUrl} alt={`${name} profile`} className="h-8 w-8 rounded-full object-cover" onError={(e)=>{(e.target as HTMLImageElement).style.display='none'}} />;
                }

                const initials = name
                  .split(" ")
                  .map((s: string) => s[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();

                return (
                  <div aria-hidden className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium text-slate-300">
                    {initials}
                  </div>
                );
              })()}

              <span className="text-sm text-slate-200">{user?.name ?? user?.username ?? "User"}</span>
              <button onClick={handleLogout} className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700 transition-colors">Logout</button>
            </div>
          </div>
        ) : (
          <a href="/login" className="px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors">Login</a>
        )}
      </div>
    </nav>
  );
}
