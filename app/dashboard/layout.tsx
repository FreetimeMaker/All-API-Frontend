"use client";
import React, { useEffect, useState } from "react";
import Sidebar from "../components/dashboard/Sidebar";
import { useRouter } from "next/navigation";
import Spinner from "../components/Spinner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const AUTH_KEYS = ['access_token', 'auth_code', 'auth_token', 'token_type', 'token_expires_at', 'user_info'];

    function clearAuth() {
      AUTH_KEYS.forEach(k => localStorage.removeItem(k));
    }

    async function checkAuth() {
      try {
        const accessToken = localStorage.getItem('access_token');
        const authCode = localStorage.getItem('auth_code');
        const userToken = localStorage.getItem('auth_token');
        const expiresAt = localStorage.getItem('token_expires_at');

        if (expiresAt && Date.now() > Number(expiresAt)) {
          clearAuth();
          router.push("/login");
          return;
        }

        const tokenToUse = accessToken || authCode || userToken;
        if (!tokenToUse) {
          router.push("/login");
          return;
        }

        const res = await fetch("/api/session", {
          headers: {
            'Authorization': `Bearer ${tokenToUse}`,
            'x-access-token': tokenToUse,
          },
        });
        const data = await res.json();
        if (data.loggedIn) {
          setAuthenticated(true);
        } else {
          clearAuth();
          router.push("/login");
        }
      } catch (error) {
        clearAuth();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Spinner />
          <p className="text-slate-400 font-medium">Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) return null;

  return (
    <div className="flex bg-slate-950 min-h-[calc(100vh-64px)]">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
