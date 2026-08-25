"use client";
import React from "react";
import { createClient } from "@/lib/supabase/client";

function ProviderIcon({ provider }: { provider: "github" | "gitlab" }) {
  if (provider === "github") {
    return (
      <svg width="18" height="18" viewBox="0 0 16 16" fill="#e2e8f0" aria-hidden>
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.65 7.65 0 018 4.6c.68.003 1.36.092 2 .27 1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
      </svg>
    );
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#e2e8f0" aria-hidden>
      <path d="M22.65 14.39L12 22.13 1.35 14.39a.84.84 0 0 1-.3-.94l1.22-3.78 2.44-7.51A.84.84 0 0 1 5.39 1h13.22a.84.84 0 0 1 .8.16l2.44 7.51 1.22 3.78a.84.84 0 0 1-.3.94zM12 20.13l8.5-6.07-1.08-3.33-7.42-5.32-7.42 5.32-1.08 3.33z" />
    </svg>
  );
}

export default function LoginPage() {
  const supabase = createClient();

  async function redirectTo(provider: "github" | "gitlab") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error("Login error:", error.message);
    }
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-6 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900 rounded-xl shadow-lg p-8 border border-slate-800">
        <h1 className="text-2xl font-semibold text-white">All API</h1>
        <p className="mt-2 text-sm text-slate-400">Sign in with your Account to manage all products.</p>
        <div className="mt-6 flex flex-col gap-3">
          <button onClick={() => redirectTo("github")} className="flex items-center gap-3 px-4 py-3 border border-slate-700 rounded-lg hover:bg-slate-800 hover:border-slate-600 transition-all duration-200">
            <ProviderIcon provider="github" />
            <span className="font-medium text-slate-200">Sign in with GitHub</span>
          </button>
          <button onClick={() => redirectTo("gitlab")} className="flex items-center gap-3 px-4 py-3 border border-slate-700 rounded-lg hover:bg-slate-800 hover:border-slate-600 transition-all duration-200">
            <ProviderIcon provider="gitlab" />
            <span className="font-medium text-slate-200">Sign in with GitLab</span>
          </button>
        </div>
      </div>
    </main>
  );
}
