"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface HealthData {
  ok: boolean;
  status: number;
  body: {
    status: string;
    service: string;
    timestamp: string;
    checks: Record<string, string>;
  } | null;
}

interface ProductsData {
  count: number;
  products: Array<{
    id: number;
    name: string;
    description: string;
    price: number;
    currency: string;
    stock: number;
    category: string;
    imageUrl: string;
    createdAt: string;
  }>;
}

export default function StatsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [products, setProducts] = useState<ProductsData | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    Promise.all([
      supabase.auth.getUser(),
      fetch("/api/health").then(r => r.json()),
      fetch("/api/proxy/api/v1/fms/products").then(r => r.json()),
    ]).then(([authRes, healthRes, productsRes]) => {
      setUser(authRes.data.user);
      setHealth(healthRes);
      setProducts(productsRes);
      setLoading(false);
    }).catch(() => setLoading(false));
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

  const provider = user?.app_metadata?.provider || "unknown";
  const accountAge = user?.created_at
    ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const stats = [
    {
      title: "API Status",
      value: health?.ok ? "Operational" : "Down",
      detail: health?.body?.service || "N/A",
      color: health?.ok ? "emerald" : "red",
    },
    {
      title: "Health Checks",
      value: health?.body?.checks ? Object.keys(health.body.checks).length.toString() : "0",
      detail: health?.body?.checks ? Object.entries(health.body.checks).map(([k, v]) => `${k}: ${v}`).join(", ") : "None",
      color: "indigo",
    },
    {
      title: "Products",
      value: products?.count?.toString() || "0",
      detail: products?.count ? products.products.map(p => p.name).join(", ") : "No products",
      color: "amber",
    },
    {
      title: "Auth Provider",
      value: provider.charAt(0).toUpperCase() + provider.slice(1),
      detail: `Account age: ${accountAge} days`,
      color: "sky",
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">Statistics</h1>
        <p className="text-slate-400">Live data from the Freetime Maker API.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-sm">
            <p className="text-sm font-medium text-slate-400">{stat.title}</p>
            <p className={`text-xl font-bold mt-1 text-${stat.color}-400`}>{stat.value}</p>
            <p className="text-xs text-slate-500 mt-2 truncate" title={stat.detail}>{stat.detail}</p>
          </div>
        ))}
      </div>

      {health?.body && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm">
          <div className="p-4 border-b border-slate-700">
            <h2 className="font-semibold text-slate-100">Health Details</h2>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Status</p>
                <p className="text-slate-200 font-medium">{health.body.status}</p>
              </div>
              <div>
                <p className="text-slate-500">Service</p>
                <p className="text-slate-200 font-medium">{health.body.service}</p>
              </div>
              <div>
                <p className="text-slate-500">Last Checked</p>
                <p className="text-slate-200 font-medium">{new Date(health.body.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500">Response Code</p>
                <p className="text-slate-200 font-medium">{health.status}</p>
              </div>
            </div>
            {health.body.checks && Object.keys(health.body.checks).length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <p className="text-sm text-slate-500 mb-2">Service Checks</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(health.body.checks).map(([service, status]) => (
                    <span key={service} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-800 text-xs text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      {service}: {status}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {products && products.count > 0 && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm">
          <div className="p-4 border-b border-slate-700">
            <h2 className="font-semibold text-slate-100">Freetime Maker Shop Products</h2>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 text-slate-400 font-medium">Name</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Category</th>
                    <th className="text-right py-2 text-slate-400 font-medium">Price</th>
                    <th className="text-right py-2 text-slate-400 font-medium">Stock</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {products.products.map((p) => (
                    <tr key={p.id} className="border-b border-slate-700/50">
                      <td className="py-3 text-slate-100 font-medium">{p.name}</td>
                      <td className="py-3 text-slate-300">{p.category}</td>
                      <td className="py-3 text-slate-300 text-right">${p.price} {p.currency}</td>
                      <td className="py-3 text-slate-300 text-right">{p.stock.toLocaleString()}</td>
                      <td className="py-3 text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
