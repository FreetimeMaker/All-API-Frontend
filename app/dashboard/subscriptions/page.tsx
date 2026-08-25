"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
}

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
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<number | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: import("@supabase/supabase-js").User | null } }) => {
      setUser(user);
      if (user) fetchData();
      else setLoading(false);
    });
  }, [supabase]);

  async function getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function fetchData() {
    try {
      const headers = await getAuthHeaders();

      const [subsRes, plansRes] = await Promise.all([
        fetch("/api/proxy/api/v1/geoweather/subscriptions", { headers }),
        fetch("/api/proxy/api/v1/geoweather/subscriptions/plans", { headers }),
      ]);

      if (subsRes.ok) {
        const subsData = await subsRes.json();
        setSubscriptions(Array.isArray(subsData) ? subsData : subsData.subscriptions || []);
      }

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        const rawPlans = Array.isArray(plansData) ? plansData : plansData.plans || [];
        setPlans(rawPlans.map((p: Record<string, unknown>) => ({
          id: String(p.id || p.planId || p.slug || ""),
          name: String(p.name || p.plan || p.id || ""),
          price: Number(p.price || p.amount || 0),
          currency: String(p.currency || "USD"),
          interval: String(p.interval || p.billingCycle || "month"),
          features: Array.isArray(p.features) ? p.features.map(String) : [],
        })));
      } else {
        setPlans([
          { id: "free", name: "Free", price: 0, currency: "USD", interval: "month", features: ["1 city", "Daily forecast", "Basic alerts"] },
          { id: "freemium", name: "Freemium", price: 2.99, currency: "USD", interval: "month", features: ["5 cities", "Hourly forecast", "Severe weather alerts", "Email support"] },
          { id: "premium", name: "Premium", price: 9.99, currency: "USD", interval: "month", features: ["Unlimited cities", "Real-time updates", "Custom alerts", "Priority support", "API access"] },
        ]);
      }

      if (!subsRes.ok && !plansRes.ok && subsRes.status === 401) {
        setError("Authentication required. Please sign in again.");
      }
    } catch {
      setError("Failed to load data.");
      setPlans([
        { id: "free", name: "Free", price: 0, currency: "USD", interval: "month", features: ["1 city", "Daily forecast", "Basic alerts"] },
        { id: "freemium", name: "Freemium", price: 2.99, currency: "USD", interval: "month", features: ["5 cities", "Hourly forecast", "Severe weather alerts", "Email support"] },
        { id: "premium", name: "Premium", price: 9.99, currency: "USD", interval: "month", features: ["Unlimited cities", "Real-time updates", "Custom alerts", "Priority support", "API access"] },
      ]);
    }
    setLoading(false);
  }

  async function handleSubscribe(planId: string) {
    if (!user) return;
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    setSubscribing(planId);
    setSuccess(null);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/proxy/api/v1/geoweather/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ plan: planId }),
      });

      if (res.ok) {
        setSuccess(`Subscribed to ${plan.name} plan!`);
        fetchData();
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.message || "Failed to subscribe.");
      }
    } catch {
      alert("Failed to subscribe.");
    }
    setSubscribing(null);
    setTimeout(() => setSuccess(null), 3000);
  }

  async function handleCancel(sub: Subscription) {
    if (!confirm(`Cancel your ${sub.plan} subscription?`)) return;
    setCancelling(sub.id);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/proxy/api/v1/geoweather/subscriptions/${sub.id}`, {
        method: "DELETE",
        headers,
      });

      if (res.ok) {
        setSubscriptions(prev => prev.filter(s => s.id !== sub.id));
        setSuccess("Subscription cancelled.");
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.message || "Failed to cancel subscription.");
      }
    } catch {
      alert("Failed to cancel subscription.");
    }
    setCancelling(null);
    setTimeout(() => setSuccess(null), 3000);
  }

  function isSubscribed(planId: string) {
    return subscriptions.some(s => s.plan === planId && s.status === "active");
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
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">GeoWeather Subscriptions</h1>
        <p className="text-slate-400">Choose a plan and manage your weather subscriptions.</p>
      </header>

      {success && (
        <div className="bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 px-4 py-3 rounded-lg text-sm font-medium">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-amber-950/60 border border-amber-800/50 text-amber-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const subscribed = isSubscribed(plan.id);
            return (
              <div key={plan.id} className={`bg-slate-800 rounded-xl border shadow-sm p-6 flex flex-col ${
                subscribed ? "border-emerald-700" : "border-slate-700"
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-100">{plan.name}</h3>
                  {subscribed && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400 border border-emerald-800">Active</span>
                  )}
                </div>
                <div className="mb-6">
                  <span className="text-3xl font-bold text-slate-100">
                    {plan.price === 0 ? "Free" : `$${plan.price}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-sm text-slate-500">/{plan.interval}</span>
                  )}
                </div>
                {plan.features.length > 0 && (
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
                {subscribed ? (
                  <button disabled className="w-full py-2.5 text-sm font-medium rounded-lg bg-slate-700 text-slate-400 cursor-default">
                    Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={subscribing === plan.id || plan.price === 0}
                    className="w-full py-2.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                  >
                    {subscribing === plan.id ? "Subscribing..." : plan.price === 0 ? "Included" : "Subscribe"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {subscriptions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-100 mb-4">Your Active Subscriptions</h2>
          <div className="space-y-3">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-100 capitalize">{sub.plan}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      sub.status === "active"
                        ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800"
                        : "bg-slate-700 text-slate-400 border border-slate-600"
                    }`}>{sub.status}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
                    {sub.city && <span>City: {sub.city}</span>}
                    {sub.country && <span>{sub.country}</span>}
                    <span>${sub.price} {sub.currency}</span>
                    {sub.nextBilling && <span>Next billing: {new Date(sub.nextBilling).toLocaleDateString()}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleCancel(sub)}
                  disabled={cancelling === sub.id}
                  className="px-4 py-2 text-sm font-medium rounded-lg border border-red-800 text-red-400 hover:bg-red-900/50 transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {cancelling === sub.id ? "Cancelling..." : "Cancel"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
