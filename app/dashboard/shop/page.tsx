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
  stock: number;
  category: string;
  imageUrl: string;
  createdAt: string;
}

interface Purchase {
  productId: number;
  purchasedAt: string;
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<number | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    Promise.all([
      supabase.auth.getUser(),
      fetch("/api/proxy/api/v1/fms/products").then(r => r.json()),
    ]).then(([authRes, productsRes]) => {
      setUser(authRes.data.user);
      setProducts(productsRes.products || []);
      const existing = authRes.data.user?.user_metadata?.purchases || [];
      setPurchases(existing);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [supabase]);

  async function handleBuy(product: Product) {
    if (!user) return;
    setBuying(product.id);
    setSuccess(null);

    const alreadyOwned = purchases.some((p: Purchase) => p.productId === product.id);
    if (alreadyOwned) {
      setBuying(null);
      return;
    }

    const newPurchase: Purchase = {
      productId: product.id,
      purchasedAt: new Date().toISOString(),
    };
    const updatedPurchases = [...purchases, newPurchase];

    const { error } = await supabase.auth.updateUser({
      data: { purchases: updatedPurchases },
    });

    if (!error) {
      setPurchases(updatedPurchases);
      setSuccess(`${product.name} added to your account!`);
      setTimeout(() => setSuccess(null), 3000);
    }
    setBuying(null);
  }

  function isOwned(productId: number) {
    return purchases.some((p: Purchase) => p.productId === productId);
  }

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
        <h1 className="text-2xl font-bold text-slate-100">Shop</h1>
        <p className="text-slate-400">Browse and purchase Freetime Maker products.</p>
      </header>

      {success && (
        <div className="bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 px-4 py-3 rounded-lg text-sm font-medium">
          {success}
        </div>
      )}

      {products.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
          <p className="text-slate-400">No products available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const owned = isOwned(product.id);
            return (
              <div key={product.id} className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-900 h-40 flex items-center justify-center">
                  {product.imageUrl ? (
                    <img
                      src={`/api/proxy/${product.imageUrl.replace(/^\//, "")}`}
                      alt={product.name}
                      className="h-full w-full object-contain p-4"
                    />
                  ) : (
                    <span className="text-4xl">📦</span>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-slate-100">{product.name}</h3>
                    <span className="text-xs px-2 py-1 rounded bg-indigo-900/50 text-indigo-400 border border-indigo-800 whitespace-nowrap">
                      {product.category}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-2 flex-1">{product.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-xl font-bold text-slate-100">${product.price}</p>
                      <p className="text-xs text-slate-500">{product.stock.toLocaleString()} in stock</p>
                    </div>
                    {owned ? (
                      <span className="px-4 py-2 text-sm font-medium rounded-lg bg-emerald-900/50 text-emerald-400 border border-emerald-800">
                        Owned
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBuy(product)}
                        disabled={buying === product.id}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50"
                      >
                        {buying === product.id ? "Processing..." : "Buy Now"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
