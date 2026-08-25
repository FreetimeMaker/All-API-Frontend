"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: import("@supabase/supabase-js").User | null } }) => setUser(user));
  }, [supabase]);

  if (!user) return null;

  const name = user.user_metadata?.full_name || user.user_metadata?.name || "User";
  const email = user.email || "N/A";
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
  const provider = user.app_metadata?.provider || "unknown";
  const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-100">Profile</h1>
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 space-y-4">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-slate-700 flex items-center justify-center text-xl font-medium text-slate-300">
              {name.split(" ").map((s: string) => s[0]).slice(0, 2).join("").toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold text-slate-100">{name}</h2>
            <p className="text-sm text-slate-400">{email}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
          <div>
            <p className="text-xs text-slate-500 uppercase">Provider</p>
            <p className="text-sm text-slate-200 capitalize">{provider}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase">Member Since</p>
            <p className="text-sm text-slate-200">{createdAt}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 uppercase">User ID</p>
            <p className="text-sm text-slate-200 font-mono">{user.id}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
