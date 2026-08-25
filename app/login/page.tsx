"use client";
import React from "react";

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
      <path d="M12 0l3 7h-6l3-7zm0 24l-3-7h6l-3 7zm-8-9l3-7h-6l3 7zm16 0l3-7h-6l3 7z" />
    </svg>
  );
}

export default function LoginPage() {
  function redirectTo(provider: "github" | "gitlab") {
    // Redirect to the API's OAuth login, but specify our custom callback handler
    // Our custom handler will intercept the response and extract tokens
    const callbackUrl = `${window.location.origin}/api/auth/callback?provider=${provider}`;
    window.location.href = `/api/proxy/api/v1/auth/login?provider=${provider}&next=${encodeURIComponent(callbackUrl)}`;
  }

  return (
    <main className="flex items-center justify-center min-h-screen p-6 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900 rounded-xl shadow-lg p-8 border border-slate-800">
        <h1 className="text-2xl font-semibold text-white">Anmelden</h1>
        <p className="mt-2 text-sm text-slate-400">Bitte mit GitHub oder GitLab anmelden. Weiterleitungen laufen über den Server.</p>

        <div className="mt-6 flex flex-col gap-3">
          <button onClick={() => redirectTo("github")} className="flex items-center gap-3 px-4 py-3 border border-slate-700 rounded-lg hover:bg-slate-800 hover:border-slate-600 transition-all duration-200">
            <ProviderIcon provider="github" />
            <span className="font-medium text-slate-200">Mit GitHub anmelden</span>
          </button>

          <button onClick={() => redirectTo("gitlab")} className="flex items-center gap-3 px-4 py-3 border border-slate-700 rounded-lg hover:bg-slate-800 hover:border-slate-600 transition-all duration-200">
            <ProviderIcon provider="gitlab" />
            <span className="font-medium text-slate-200">Mit GitLab anmelden</span>
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-500">Hinweis: Vor jedem API-Aufruf prüft der Server die Health-API; wenn die API nicht verfügbar ist, wird die Anfrage abgelehnt.</p>
      </div>
    </main>
  );
}
