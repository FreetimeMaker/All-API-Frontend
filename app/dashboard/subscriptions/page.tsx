"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import SolanaPayModal from "@/app/components/dashboard/SolanaPayModal";

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
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
}

const fallbackPlans: Plan[] = [
  { id: "free", name: "Free", price: 0, currency: "USD", features: ["1 city", "Daily forecast", "100 Requests/Day"] },
  { id: "freemium", name: "Freemium", price: 2.99, currency: "USD", features: ["5 cities", "Hourly forecast", "1000 Requests/Day"] },
  { id: "premium", name: "Premium", price: 9.99, currency: "USD", features: ["Unlimited cities", "2000 Requests/Day"] },
  { id: "ultrimium", name: "Ultrimium", price: 16.99, currency: "USD", features: ["Everything the App and Open-Meteo.com have to offer"]},
];

const planTier: Record<string, number> = { free: 0, freemium: 1, premium: 2, ultrimium: 3 };

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>(fallbackPlans);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [payingPlan, setPayingPlan] = useState<Plan | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<string | null>(null);

  const currentTier = (() => {
    const codeTier = activePlan ? (planTier[activePlan.toLowerCase()] ?? -1) : -1;
    const subTier = subscriptions.reduce((max, sub) => {
      const t = planTier[sub.plan.toLowerCase()] ?? -1;
      return t > max ? t : max;
    }, -1);
    return Math.max(codeTier, subTier);
  })();

  useEffect(() => {
    fetch("/api/proxy/api/v1/geoweather/subscriptions/plans")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          const raw = Array.isArray(data) ? data : data.plans || [];
          if (raw.length > 0) {
            setPlans(raw.map((p: Record<string, unknown>) => ({
              id: String(p.id || p.planId || p.slug || ""),
              name: String(p.name || p.plan || p.id || ""),
              price: Number(p.price || p.amount || 0),
              currency: String(p.currency || "USD"),
              interval: String(p.interval || p.billingCycle || "month"),
              features: Array.isArray(p.features) ? p.features.map(String) : [],
            })));
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: import("@supabase/supabase-js").User | null } }) => {
      if (!user) return;
      supabase
        .from("geoweather_codes")
        .select("type")
        .eq("used_by", user.id)
        .eq("is_used", true)
        .order("used_at", { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }: { data: { type: string } | null }) => {
          if (data?.type) setActivePlan(data.type);
        });
    });
  }, []);

  function handlePay(plan: Plan) {
    if (plan.price === 0) return;
    setPayingPlan(plan);
    setError(null);
    setSuccess(null);
    setShowPayModal(true);
  }

  function handlePaymentSuccess(signature: string) {
    setShowPayModal(false);
    setPayingPlan(null);
    setSuccess(`Successfully subscribed to ${payingPlan?.name}! Tx: ${signature.slice(0, 8)}...`);
    setTimeout(() => setSuccess(null), 8000);
  }

  function handlePaymentError(msg: string) {
    setShowPayModal(false);
    setPayingPlan(null);
    setError(`Payment failed: ${msg}`);
    setTimeout(() => setError(null), 5000);
  }

  async function handleRedeem() {
    const code = redeemCode.trim();
    if (!code) return;

    setRedeeming(true);
    setRedeemSuccess(null);
    setRedeemError(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("redeem_code", { code });

      if (error) {
        setRedeemError(error.message || "Failed to redeem code.");
        setTimeout(() => setRedeemError(null), 5000);
        return;
      }

      if (data?.success) {
        const planName = data.plan || data.type || "selected";
        setActivePlan(planName);
        setRedeemSuccess(`Code redeemed! You now have access to the ${planName} plan.`);
        setRedeemCode("");
        setTimeout(() => setRedeemSuccess(null), 8000);
      } else {
        setRedeemError(data?.error || "Invalid or already used code.");
        setTimeout(() => setRedeemError(null), 5000);
      }
    } catch {
      setRedeemError("An unexpected error occurred.");
      setTimeout(() => setRedeemError(null), 5000);
    } finally {
      setRedeeming(false);
    }
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
        <p className="text-slate-400">Choose a plan and pay with Solana Pay.</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6 flex flex-col">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-100">{plan.name}</h3>
            </div>
            <div className="mb-6">
              <span className="text-3xl font-bold text-slate-100">
                {plan.price === 0 ? "Free" : `$${plan.price}`}
              </span>
              {plan.price > 0 && (
                <p className="text-xs text-slate-500 mt-1">Paid with Solana Pay</p>
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
            <div className="mt-auto">
              {plan.price === 0 && !activePlan ? (
                <button disabled className="w-full py-2.5 text-sm font-medium rounded-lg bg-slate-700 text-slate-400 cursor-default">
                  Free Tier
                </button>
              ) : planTier[plan.id] !== undefined && planTier[plan.id] <= currentTier ? (
                <button disabled className="w-full py-2.5 text-sm font-medium rounded-lg bg-emerald-900/50 text-emerald-300 border border-emerald-800 cursor-default flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {planTier[plan.id] === currentTier ? "Current Plan" : "Included in your plan"}
                </button>
              ) : plan.price === 0 ? (
                <button disabled className="w-full py-2.5 text-sm font-medium rounded-lg bg-slate-700 text-slate-400 cursor-default">
                  Free Tier
                </button>
              ) : (
                <button
                  onClick={() => handlePay(plan)}
                  disabled={showPayModal}
                  className="w-full py-2.5 text-sm font-medium rounded-lg bg-[#9945FF] text-white hover:bg-[#8833EE] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2.5 5.5L8 2L13.5 5.5V10.5L8 14L2.5 10.5V5.5Z" fill="white" />
                  </svg>
                  Pay ${plan.price}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {currentTier < 3 && (
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-1">Redeem Code</h2>
        <p className="text-sm text-slate-400 mb-4">Have a promo or gift code? Enter it below to activate your subscription.</p>
        {redeemSuccess && (
          <div className="bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 px-4 py-3 rounded-lg text-sm font-medium mb-4">
            {redeemSuccess}
          </div>
        )}
        {redeemError && (
          <div className="bg-amber-950/60 border border-amber-800/50 text-amber-300 px-4 py-3 rounded-lg text-sm mb-4">
            {redeemError}
          </div>
        )}
        <div className="flex gap-3">
          <input
            type="text"
            value={redeemCode}
            onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter") handleRedeem(); }}
            placeholder="Enter code"
            disabled={redeeming}
            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 text-sm font-mono tracking-wider focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
          />
          <button
            onClick={handleRedeem}
            disabled={redeeming || !redeemCode.trim()}
            className="px-6 py-2.5 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {redeeming ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Redeeming...
              </>
            ) : (
              "Redeem"
            )}
          </button>
        </div>
      </div>
      )}

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
                    <span>${sub.price} {sub.currency}</span>
                    {sub.nextBilling && <span>Next billing: {new Date(sub.nextBilling).toLocaleDateString()}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 text-center">
        <p className="text-xs text-slate-500">
          Payments are processed via Solana Pay. Scan the QR code with any Solana wallet (Phantom, Solflare, etc.).
        </p>
      </div>

      <SolanaPayModal
        open={showPayModal}
        amount={payingPlan?.price || 0}
        label={payingPlan ? `GeoWeather ${payingPlan.name}` : ""}
        message={payingPlan ? `Subscribe to ${payingPlan.name} plan` : ""}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        onClose={() => { setShowPayModal(false); setPayingPlan(null); }}
      />
    </div>
  );
}
