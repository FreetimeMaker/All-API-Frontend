"use client";
import React, { useEffect, useState } from "react";

export default function LogoutPage() {
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    fetch("/api/session")
      .then((r) => r.json())
      .then((j) => {
        if (!mounted) return;
        setLoggedIn(Boolean(j?.loggedIn));
        setUser(j?.user ?? null);
      })
      .catch(() => setLoggedIn(false))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogout() {
    setMessage(null);
    try {
      const res = await fetch(`/api/proxy/api/v1/auth/logout`, { method: "POST" });
      if (!res.ok) {
        setMessage(`Logout failed: ${res.status}`);
      } else {
        setMessage("Erfolgreich abgemeldet.");
        setLoggedIn(false);
      }
    } catch (e: any) {
      setMessage(`Error: ${e?.message ?? e}`);
    }
  }

  if (loading) return <main className="p-8 text-slate-300">Checking session…</main>;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold text-slate-100">Logout</h1>
      {loggedIn ? (
        <div className="mt-4">
          <p className="text-slate-300">Angemeldet als <strong className="text-slate-100">{user?.name ?? user?.username ?? "User"}</strong></p>
          <button onClick={handleLogout} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">Logout</button>
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-slate-400">Du bist nicht angemeldet.</p>
          <a href="/login" className="mt-2 inline-block px-3 py-1 bg-indigo-600 text-white rounded">Zur Anmeldung</a>
        </div>
      )}

      {message && <div className="mt-4 p-3 bg-slate-800 rounded text-slate-200">{message}</div>}
    </main>
  );
}
