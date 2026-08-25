"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  imageUrl: string;
}

interface Purchase {
  productId: number;
  purchasedAt: string;
}

export default function PurchasesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    Promise.all([
      supabase.auth.getUser(),
      fetch("/api/proxy/api/v1/fms/products").then(r => r.json()),
    ]).then(([authRes, productsRes]) => {
      setUser(authRes.data.user);
      setProducts(productsRes.products || []);
      setPurchases(authRes.data.user?.user_metadata?.purchases || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [supabase]);

  async function handleRemove(productId: number) {
    if (!user) return;
    const updated = purchases.filter((p: Purchase) => p.productId !== productId);
    const { error } = await supabase.auth.updateUser({ data: { purchases: updated } });
    if (!error) setPurchases(updated);
  }

  const ownedProducts = purchases
    .map((purchase: Purchase) => {
      const product = products.find((p: Product) => p.id === purchase.productId);
      return product ? { ...product, purchasedAt: purchase.purchasedAt } : null;
    })
    .filter(Boolean) as (Product & { purchasedAt: string })[];

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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">My Purchases</h1>
        <p className="text-slate-400">Products you own. They appear here immediately after purchase.</p>
      </header>

      {ownedProducts.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
          <span className="text-4xl mb-4 block">🛒</span>
          <p className="text-slate-300 font-medium">No purchases yet</p>
          <p className="text-sm text-slate-500 mt-1">Visit the shop to browse products.</p>
          <a href="/dashboard/shop" className="mt-4 inline-block px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">
            Go to Shop
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {ownedProducts.map((product) => (
            <div key={product.id} className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-4 flex items-center gap-4">
              <div className="h-16 w-16 rounded-lg bg-slate-900 flex items-center justify-center overflow-hidden flex-shrink-0">
                {product.imageUrl ? (
                  <img src={`https://all-api-node.vercel.app${product.imageUrl}`} alt={product.name} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-2xl">📦</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-100 truncate">{product.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-400 border border-emerald-800">Owned</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{product.category}</p>
                <p className="text-xs text-slate-500 mt-0.5">Purchased {new Date(product.purchasedAt).toLocaleDateString()}</p>
              </div>
              <button
                onClick={() => handleRemove(product.id)}
                className="text-xs text-slate-500 hover:text-red-400 transition-colors px-2 py-1"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
