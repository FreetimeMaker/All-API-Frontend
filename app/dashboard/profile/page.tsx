"use client";
import React, { useEffect, useState } from "react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/session")
      .then(res => res.json())
      .then(data => setUser(data.user));
  }, []);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">User Profile</h1>
        <p className="text-slate-400">Manage your account settings and personal information.</p>
      </header>

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-purple-600" />
        <div className="px-6 pb-6">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="h-24 w-24 rounded-full border-4 border-slate-800 bg-slate-700 overflow-hidden shadow-sm">
              {user.avatar || user.avatar_url || user.picture ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar || user.avatar_url || user.picture}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-3xl text-slate-400">
                  {user.name?.[0] || user.username?.[0] || "?"}
                </div>
              )}
            </div>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
              Edit Profile
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100">{user.name || "No name provided"}</h2>
              <p className="text-slate-400 text-sm">@{user.username || "username"}</p>
            </div>

            <hr className="border-slate-700" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase">Email Address</p>
                <p className="text-sm font-medium text-slate-200">{user.email || "Not provided"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase">Role</p>
                <p className="text-sm font-medium text-slate-200">Administrator</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase">Provider</p>
                <p className="text-sm font-medium text-slate-200">GitHub</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase">Member since</p>
                <p className="text-sm font-medium text-slate-200">August 2026</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-slate-100">Security</h3>
        <div className="flex items-center justify-between p-3 border border-slate-700 rounded-lg">
          <div>
            <p className="text-sm font-medium text-slate-200">Two-Factor Authentication</p>
            <p className="text-xs text-slate-400">Additional protection for your account.</p>
          </div>
          <button className="text-sm text-indigo-400 font-medium">Enable</button>
        </div>
      </div>
    </div>
  );
}
