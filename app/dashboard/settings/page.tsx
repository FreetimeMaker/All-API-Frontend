"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: import("@supabase/supabase-js").User | null } }) => {
      setUser(user);
      setLoading(false);
    });
  }, [supabase]);

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

  if (!user) return null;

  const provider = user.app_metadata?.provider || "unknown";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="text-slate-400">Manage your account preferences.</p>
      </header>

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm">
        <div className="p-4 border-b border-slate-700">
          <h2 className="font-semibold text-slate-100">Account</h2>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-200">Email</p>
              <p className="text-xs text-slate-400">{user.email || "Not set"}</p>
            </div>
            <span className="text-xs text-slate-500">Managed by {provider}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-slate-700">
            <div>
              <p className="text-sm font-medium text-slate-200">Auth Provider</p>
              <p className="text-xs text-slate-400">Connected via {provider.charAt(0).toUpperCase() + provider.slice(1)}</p>
            </div>
            <span className="px-2 py-1 text-xs rounded bg-emerald-900/50 text-emerald-400 border border-emerald-800">Active</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm">
        <div className="p-4 border-b border-slate-700">
          <h2 className="font-semibold text-slate-100">Sessions</h2>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-200">Current Session</p>
              <p className="text-xs text-slate-400">Signed in via {provider}</p>
            </div>
            <span className="px-2 py-1 text-xs rounded bg-emerald-900/50 text-emerald-400 border border-emerald-800">Active</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm">
        <div className="p-4 border-b border-slate-700">
          <h2 className="font-semibold text-slate-100">Danger Zone</h2>
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-200">Sign Out</p>
              <p className="text-xs text-slate-400">End your current session on this device</p>
            </div>
            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
              className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
