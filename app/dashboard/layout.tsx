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
    async function checkAuth() {
      try {
        // First check localStorage for tokens
        const accessToken = localStorage.getItem('access_token');
        const authCode = localStorage.getItem('auth_code');
        const userToken = localStorage.getItem('auth_token');
        const userInfo = localStorage.getItem('user_info');
        const mockSession = localStorage.getItem('mock_session');
        
        console.log("Layout: Checking auth - tokens present:", !!accessToken, !!authCode, !!userToken, "user info:", !!userInfo, "mock session:", mockSession);
        
        // If we have any form of auth data, consider authenticated
        if (accessToken || authCode || userToken || userInfo || mockSession === 'true') {
          setAuthenticated(true);
          setLoading(false);
          return;
        }
        
        // Otherwise check API session
        const res = await fetch("/api/session");
        const data = await res.json();
        if (data.loggedIn) {
          setAuthenticated(true);
        } else {
          router.push("/login");
        }
      } catch (error) {
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
