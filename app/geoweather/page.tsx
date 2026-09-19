"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  appwriteAccount,
  appwriteFunctions,
  GEO_WEATHER_REDEEM_FUNCTION_ID,
  getGeoWeatherSubscription,
} from "@/lib/appwrite/geoweather";
import SolanaPayModal from "../components/dashboard/SolanaPayModal";
import Spinner from "../components/Spinner";

const HallidayPayButton = dynamic(() => import("../components/dashboard/HallidayPayButton"), { ssr: false });

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  features: string[];
}

const fallbackPlans: Plan[] = [
  { id: "free", name: "Free", price: 0, currency: "USD", features: ["1 city", "Daily forecast", "100 Requests/Day"] },
  { id: "freemium", name: "Freemium", price: 2.99, currency: "USD", features: ["5 cities", "Hourly forecast", "1000 Requests/Day"] },
  { id: "premium", name: "Premium", price: 9.99, currency: "USD", features: ["Unlimited cities", "2000 Requests/Day"] },
  { id: "ultrimium", name: "Ultrimium", price: 16.99, currency: "USD", features: ["Everything the App and Open-Meteo.com have to offer"] },
];

const tier: Record<string, number> = { free: 0, freemium: 1, premium: 2, ultrimium: 3 };

export default function GeoWeatherShopPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [plans, setPlans] = useState<Plan[]>(fallbackPlans);
  const [activePlan, setActivePlan] = useState("free");
  const [loading, setLoading] = useState(true);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemMsg, setRedeemMsg] = useState<string | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [payingPlan, setPayingPlan] = useState<Plan | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [shopMsg, setShopMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const current = await appwriteAccount.get();
        setUser(current);
        setActivePlan(await getGeoWeatherSubscription(current.$id));
      } catch {
        router.replace("/geoweather/login");
        return;
      }

      try {
        const response = await fetch("https://api.free-time.me/v2/geoweather/subscriptions/plans");
        const data = response.ok ? await response.json() : null;
        const raw = Array.isArray(data) ? data : data?.plans || [];
        if (raw.length) {
          setPlans(raw.map((p: any) => ({
            id: String(p.id || p.planId || p.slug || ""),
            name: String(p.name || p.plan || p.id || ""),
            price: Number(p.price || p.amount || 0),
            currency: String(p.currency || "USD"),
            features: Array.isArray(p.features) ? p.features.map(String) : [],
          })));
        }
      } catch {}
      setLoading(false);
    })();
  }, [router]);

  const currentTier = tier[activePlan.toLowerCase()] ?? 0;

  async function redeem() {
    const code = redeemCode.trim();
    if (!code) return;
    setRedeeming(true);
    setRedeemMsg(null);
    try {
      const execution = await appwriteFunctions.createExecution({
        functionId: GEO_WEATHER_REDEEM_FUNCTION_ID,
        body: JSON.stringify({ code }),
        async: false,
      });
      const result = JSON.parse(execution.responseBody || "{}");
      if (!result.ok) throw new Error(result.error || "Invalid or already used code.");
      const subscription = result.subscription || "free";
      setActivePlan(subscription);
      setRedeemCode("");
      setRedeemMsg(`Code redeemed. Active plan: ${subscription}.`);
    } catch (err: any) {
      setRedeemMsg(err?.message || "Could not redeem this code.");
    } finally {
      setRedeeming(false);
    }
  }

  async function signOut() {
    await appwriteAccount.deleteSession({ sessionId: "current" });
    router.replace("/geoweather/login");
  }

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Spinner /></div>;
  if (!user) return null;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">GeoWeather</p>
            <h1 className="text-2xl font-bold">Subscription Shop</h1>
            <p className="text-sm text-slate-400">Signed in with your GeoWeather Appwrite account.</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/shop" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">Wallpaper Shop</a>
            <button onClick={signOut} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10">Sign out</button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 rounded-3xl border border-sky-400/20 bg-sky-400/[0.08] p-6 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">{user.name || user.email}</p>
              <h2 className="mt-1 text-xl font-semibold">Current plan: <span className="capitalize text-sky-300">{activePlan}</span></h2>
            </div>
            <p className="text-sm text-slate-400">{user.email}</p>
          </div>
        </div>

        {shopMsg && <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{shopMsg}</div>}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => {
            const planTier = tier[plan.id.toLowerCase()] ?? -1;
            const included = planTier >= 0 && planTier <= currentTier;
            return (
              <article key={plan.id} className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl transition hover:border-sky-400/30">
                <p className="text-sm text-slate-400">GeoWeather</p>
                <h3 className="mt-1 text-xl font-semibold capitalize">{plan.name}</h3>
                <div className="mt-5"><span className="text-3xl font-bold">{plan.price === 0 ? "Free" : `$${plan.price}`}</span>{plan.price > 0 && <span className="ml-1 text-sm text-slate-400">{plan.currency}</span>}</div>
                <ul className="my-6 flex-1 space-y-2 text-sm text-slate-300">
                  {plan.features.map((feature) => <li key={feature}>✓ {feature}</li>)}
                </ul>
                {included ? (
                  <button disabled className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200">{planTier === currentTier ? "Current plan" : "Included"}</button>
                ) : (
                  <div className="space-y-2">
                    <button onClick={() => { setPayingPlan(plan); setShowPayModal(true); }} className="w-full rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold hover:bg-violet-400">Pay with Solana</button>
                    <HallidayPayButton amount={plan.price} label={`GeoWeather ${plan.name}`} onSuccess={() => { setActivePlan(plan.name); setShopMsg(`Payment successful for ${plan.name}.`); }} onError={(m) => setShopMsg(`Payment failed: ${m}`)} className="w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400">Card / Crypto</HallidayPayButton>
                  </div>
                )}
              </article>
            );
          })}
        </div>

        {currentTier < 3 && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-xl">
            <h2 className="text-xl font-semibold">Redeem GeoWeather code</h2>
            <p className="mt-1 text-sm text-slate-400">Codes are redeemed directly through the GeoWeather Appwrite function.</p>
            {redeemMsg && <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm">{redeemMsg}</div>}
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input value={redeemCode} onChange={(e) => setRedeemCode(e.target.value.toUpperCase())} className="flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 font-mono outline-none focus:border-sky-400/70" placeholder="CODE" />
              <button onClick={redeem} disabled={redeeming || !redeemCode.trim()} className="rounded-xl bg-sky-500 px-6 py-3 font-semibold text-slate-950 hover:bg-sky-400 disabled:opacity-50">{redeeming ? "Redeeming..." : "Redeem"}</button>
            </div>
          </div>
        )}
      </section>

      <SolanaPayModal
        open={showPayModal}
        amount={payingPlan?.price || 0}
        label={payingPlan ? `GeoWeather ${payingPlan.name}` : ""}
        message={payingPlan ? `Subscribe to ${payingPlan.name}` : ""}
        onSuccess={() => {
          if (payingPlan) {
            setActivePlan(payingPlan.name);
            setShopMsg(`Payment successful for ${payingPlan.name}.`);
          }
          setShowPayModal(false);
          setPayingPlan(null);
        }}
        onError={(m) => {
          setShopMsg(`Payment failed: ${m}`);
          setShowPayModal(false);
          setPayingPlan(null);
        }}
        onClose={() => { setShowPayModal(false); setPayingPlan(null); }}
      />
    </main>
  );
}
