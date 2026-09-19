"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { appwriteAccount, signInGeoWeatherWithOAuth } from "@/lib/appwrite/geoweather";

export default function GeoWeatherLoginPage() {
  const router = useRouter();
  const [busyProvider, setBusyProvider] = useState<"github" | "gitlab" | null>(null);

  useEffect(() => {
    appwriteAccount.get().then(() => router.replace("/geoweather")).catch(() => {});
  }, [router]);

  function signIn(provider: "github" | "gitlab") {
    setBusyProvider(provider);
    signInGeoWeatherWithOAuth(provider);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl shadow-2xl p-7">
        <div className="mb-7 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300">GeoWeather Account</p>
          <h1 className="mt-2 text-3xl font-bold">Sign in to GeoWeather</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in with GitHub or GitLab. Your account is managed securely through GeoWeather&apos;s Appwrite project.
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => signIn("github")}
            disabled={busyProvider !== null}
            className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3.5 font-semibold transition hover:bg-white/15 disabled:opacity-50"
          >
            {busyProvider === "github" ? "Redirecting to GitHub..." : "Continue with GitHub"}
          </button>
          <button
            onClick={() => signIn("gitlab")}
            disabled={busyProvider !== null}
            className="w-full rounded-xl bg-orange-500 px-4 py-3.5 font-semibold text-white transition hover:bg-orange-400 disabled:opacity-50"
          >
            {busyProvider === "gitlab" ? "Redirecting to GitLab..." : "Continue with GitLab"}
          </button>
        </div>

        <p className="mt-6 text-center text-xs leading-5 text-slate-500">
          No separate email/password account is required. Appwrite creates or restores your GeoWeather account through the selected OAuth provider.
        </p>
      </div>
    </main>
  );
}
