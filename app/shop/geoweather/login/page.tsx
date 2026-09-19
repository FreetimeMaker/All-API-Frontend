"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ID } from "appwrite";
import { appwriteAccount, signInGeoWeatherWithOAuth } from "@/lib/appwrite/geoweather";

export default function GeoWeatherLoginPage() {
  const router = useRouter();
  const [register, setRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    appwriteAccount.get().then(() => router.replace("/shop/geoweather")).catch(() => {});
  }, [router]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      if (register) {
        await appwriteAccount.create({
          userId: ID.unique(),
          email: email.trim(),
          password,
          name: name.trim(),
        });
      }

      await appwriteAccount.createEmailPasswordSession({
        email: email.trim(),
        password,
      });
      router.replace("/shop/geoweather");
    } catch (err: any) {
      setError(err?.message || "Login failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl shadow-2xl p-7">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">GeoWeather Account</p>
          <h1 className="mt-2 text-3xl font-bold">{register ? "Create account" : "Sign in"}</h1>
          <p className="mt-2 text-sm text-slate-400">
            This login is separate from the All API account and uses GeoWeather&apos;s Appwrite account.
          </p>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        <form onSubmit={submit} className="space-y-4">
          {register && (
            <label className="block">
              <span className="mb-1.5 block text-sm text-slate-300">Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-sky-400/70" />
            </label>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm text-slate-300">Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-sky-400/70" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-slate-300">Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 outline-none focus:border-sky-400/70" />
          </label>
          <button disabled={busy} className="w-full rounded-xl bg-sky-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-50">
            {busy ? "Please wait..." : register ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-slate-500"><div className="h-px flex-1 bg-white/10" />or<div className="h-px flex-1 bg-white/10" /></div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => signInGeoWeatherWithOAuth("github")} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm hover:bg-white/10">GitHub</button>
          <button onClick={() => signInGeoWeatherWithOAuth("gitlab")} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm hover:bg-white/10">GitLab</button>
        </div>

        <button onClick={() => { setRegister(!register); setError(null); }} className="mt-6 w-full text-sm text-sky-300 hover:text-sky-200">
          {register ? "Already have an account? Sign in" : "No GeoWeather account yet? Create one"}
        </button>
      </div>
    </main>
  );
}
