"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";

interface HealthData {
  ok: boolean;
  status: number;
  body: {
    status: string;
    service: string;
    timestamp: string;
    checks: Record<string, string>;
  } | null;
  error?: string;
}

export default function HealthPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/health")
      .then(res => res.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-950">
        <svg className="animate-spin h-6 w-6 text-slate-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  const isUp = data?.ok === true;

  return (
    <main className="min-h-screen bg-slate-950 py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4 ${
            isUp
              ? "bg-emerald-950/60 border border-emerald-800/50 text-emerald-300"
              : "bg-red-950/60 border border-red-800/50 text-red-300"
          }`}>
            <span className={`h-2 w-2 rounded-full ${isUp ? "bg-emerald-400" : "bg-red-400"} animate-pulse`} />
            {isUp ? "All Systems Operational" : "System Disrupted"}
          </div>
          <h1 className="text-3xl font-bold text-white">System Status</h1>
          <p className="mt-2 text-slate-400">Freetime Maker API health overview</p>
        </div>

        {data?.body && (
          <div className="space-y-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Service</p>
                  <p className="text-slate-100 font-medium mt-1">{data.body.service}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Status</p>
                  <p className="text-slate-100 font-medium mt-1">{data.body.status}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider">HTTP Code</p>
                  <p className="text-slate-100 font-medium mt-1">{data.status}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-xs uppercase tracking-wider">Last Checked</p>
                  <p className="text-slate-100 font-medium mt-1">{new Date(data.body.timestamp).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {data.body.checks && Object.keys(data.body.checks).length > 0 && (
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
                <h2 className="text-sm text-slate-500 text-xs uppercase tracking-wider mb-4">Service Dependencies</h2>
                <div className="space-y-3">
                  {Object.entries(data.body.checks).map(([service, status]) => (
                    <div key={service} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${status === "reachable" ? "bg-emerald-400" : "bg-red-400"}`} />
                        <span className="text-sm text-slate-200 font-medium capitalize">{service}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        status === "reachable"
                          ? "bg-emerald-900/50 text-emerald-400 border border-emerald-800"
                          : "bg-red-900/50 text-red-400 border border-red-800"
                      }`}>
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isUp && data.error && (
              <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-6">
                <h2 className="text-sm text-red-400 font-medium mb-2">Error Details</h2>
                <p className="text-sm text-red-300/80">{data.error}</p>
              </div>
            )}
          </div>
        )}

        {!data?.body && !loading && (
          <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-6 text-center">
            <p className="text-red-300 font-medium">Unable to reach the API</p>
            <p className="text-sm text-red-400/70 mt-1">{data?.error || "Unknown error"}</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
