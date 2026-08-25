"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Subscription {
  id: number;
  plan: string;
  status: string;
  startDate: string;
  nextBilling: string;
  price: number;
  currency: string;
  city: string;
  country: string;
}

export default function SubscriptionsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: import("@supabase/supabase-js").User | null } }) => {
      setUser(user);
      if (!user) {
        setLoading(false);
        return;
      }
      fetchSubscriptions(user);
    });
  }, [supabase]);

  async function fetchSubscriptions(currentUser: User) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch("/api/proxy/api/v1/geoweather/subscriptions", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.status === 401) {
        setError("Authentication required. Please sign in again.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setSubscriptions(Array.isArray(data) ? data : data.subscriptions || []);
    } catch {
      setError("Failed to load subscriptions.");
    }
    setLoading(false);
  }

  async function handleCancel(sub: Subscription) {
    if (!confirm(`Cancel ${sub.plan} subscription for ${sub.city}?`)) return;
    setCancelling(sub.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`/api/proxy/api/v1/geoweather/subscriptions/${sub.id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        setSubscriptions(prev => prev.filter(s => s.id !== sub.id));
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.message || "Failed to cancel subscription.");
      }
    } catch {
      alert("Failed to cancel subscription.");
    }
    setCancelling(null);
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <svg className="animate-spin h-6 w-6 text-slate-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">GeoWeather Subscriptions</h1>
        <p className="text-slate-400">Manage your weather subscriptions. Cancel anytime.</p>
      </header>

      {error && (
        <div className="bg-amber-950/60 border border-amber-800/50 text-amber-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {!error && subscriptions.length === 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
          <span className="text-4xl mb-4 block">🌤️</span>
          <p className="text-slate-300 font-medium">No subscriptions yet</p>
          <p className="text-sm text-slate-500 mt-1">Subscribe to weather alerts for your favorite cities.</p>
        </div>
      )}

      {subscriptions.length > 0 && (
        <div className="space-y-4">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-100">{sub.plan}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      sub.status === "active"
                        ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800"
                        : "bg-slate-700 text-slate-400 border border-slate-600"
                    }`}>
                      {sub.status}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500 text-xs">City</p>
                      <p className="text-slate-200">{sub.city}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Country</p>
                      <p className="text-slate-200">{sub.country}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Price</p>
                      <p className="text-slate-200">${sub.price} {sub.currency}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Next Billing</p>
                      <p className="text-slate-200">{sub.nextBilling ? new Date(sub.nextBilling).toLocaleDateString() : "N/A"}</p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">
                    Subscribed since {new Date(sub.startDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleCancel(sub)}
                    disabled={cancelling === sub.id}
                    className="px-4 py-2 text-sm font-medium rounded-lg border border-red-800 text-red-400 hover:bg-red-900/50 transition-colors disabled:opacity-50"
                  >
                    {cancelling === sub.id ? "Cancelling..." : "Cancel Subscription"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
