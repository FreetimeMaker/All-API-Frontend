"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { proxyImageUrl } from "@/lib/proxy-image";
import { validatePromo, normalizeCode } from "@/lib/promo-codes";
import Spinner from "../components/Spinner";

interface WalloraProduct {
  id: string;
  name: string;
  description: string;
  cost: number;
  currency?: string;
  category: string;
  image_url: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
}

interface CartItem extends WalloraProduct {
  quantity: number;
}


export default function WalloraShopPage() {
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<WalloraProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [wallpaperFilter, setWallpaperFilter] = useState<string>("All");
  const router = useRouter();
  const supabase = createClient();

  const [promoInput, setPromoInput] = useState("");
  const [promoState, setPromoState] = useState<{ code: string; amountOff: number; total: number } | null>(null);
  const [promoMsg, setPromoMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [promoChecking, setPromoChecking] = useState(false);


  const wallpaperCategories = ["All", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean)))];
  const filteredProducts = wallpaperFilter === "All" ? products : products.filter((p) => p.category === wallpaperFilter);

  useEffect(() => {
    // Check authentication
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
      }
    });
  }, [router, supabase]);

  useEffect(() => {
    // Load data when user is available
    if (!user) return;

    // Load purchased IDs from user metadata
    const purchases = user.user_metadata?.purchases || [];
    const purchasedIdsSet: Set<string> = new Set(purchases.map((p: any) => p.wallpaperId).filter(Boolean));
    setPurchasedIds(purchasedIdsSet);

    // Load wallpapers from Wallora endpoint
    fetch("https://api.free-time.me/v2/wallora/wallpapers")
      .then((res) => res.json())
      .then((data) => {
        const productsData = Array.isArray(data) ? data : data.wallpapers || [];
        setProducts(productsData);

        // Filter cart to remove already purchased items
        const savedCart = localStorage.getItem("wallora_wallpaper_cart");
        if (savedCart) {
          try {
            const cartData = JSON.parse(savedCart);
            const filteredCart = cartData.filter((item: any) => !purchasedIdsSet.has(item.id));
            setCart(filteredCart);
            localStorage.setItem("wallora_wallpaper_cart", JSON.stringify(filteredCart));
          } catch {
            localStorage.removeItem("wallora_wallpaper_cart");
          }
        }

        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading Wallora wallpapers:", error);
        setLoading(false);
      });

  }, [user]);

  useEffect(() => {
    // Save cart to localStorage whenever it changes
    localStorage.setItem("wallora_wallpaper_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    // Update purchased IDs when user changes
    if (user) {
      const purchases = user.user_metadata?.purchases || [];
      const purchasedIdsSet: Set<string> = new Set(purchases.map((p: any) => p.wallpaperId).filter(Boolean));
      setPurchasedIds(purchasedIdsSet);
    }
  }, [user]);

  const addToCart = (product: WalloraProduct) => {
    if (purchasedIds.has(product.id)) {
      console.log("Item already purchased, cannot add to cart");
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart;
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const cartTotal = cart.reduce((total, item) => total + item.cost, 0);
  const cartItemCount = cart.length;
  const promoTotal = promoState ? (cartTotal - promoState.amountOff) : cartTotal;

  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Pass promo code to checkout if one is applied
    if (promoState) {
      localStorage.setItem("wallora_checkout_promo", JSON.stringify({ code: promoState.code }));
    } else {
      localStorage.removeItem("wallora_checkout_promo");
    }

    router.push("/shop/checkout");
  };

  const applyPromo = async () => {
    const code = normalizeCode(promoInput);
    if (!code) return;

    setPromoChecking(true);
    setPromoMsg(null);

    const { data, error } = await supabase
      .from("promo_codes")
      .select("id, code, discount_type, discount_value, max_uses, used_count, expires_at, active")
      .ilike("code", code)
      .maybeSingle();

    setPromoChecking(false);

    if (error) {
      setPromoMsg({ ok: false, text: "Unable to check this code right now." });
      return;
    }

    const result = validatePromo(data as any, cartTotal);
    if (!result.ok || !result.promo) {
      setPromoMsg({ ok: false, text: result.error || "Invalid code." });
      setPromoState(null);
      return;
    }

    setPromoState({ code: result.promo.code, amountOff: result.amountOff!, total: result.total! });
    setPromoInput("");
    setPromoMsg({
      ok: true,
      text: result.promo.discount_type === "percent"
        ? `${result.promo.discount_value}% off applied — you save $${result.amountOff!.toFixed(2)}.`
        : `$${result.promo.discount_value.toFixed(2)} off applied.`,
    });
    setTimeout(() => setPromoMsg(null), 8000);
  };

  const removePromo = () => {
    setPromoState(null);
    setPromoInput("");
    setPromoMsg(null);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-950">
        <Spinner />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="bg-slate-950 min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">All API Shop</h1>
            <p className="text-sm text-slate-400">Premium wallpapers</p>
          </div>
                      <button
              onClick={() => setCartOpen(!cartOpen)}
              className="relative p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">

        
            {/* Wallpaper Category Filter */}
            <div className="flex flex-wrap gap-2 mb-6">
              {wallpaperCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setWallpaperFilter(cat)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    wallpaperFilter === cat
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all group"
                >
                  {product.image_url ? (
                    <div className="aspect-video bg-slate-800 relative overflow-hidden">
                      <img
                        src={proxyImageUrl(product.image_url)}
                        alt={product.name}
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-indigo-900/30 to-slate-800 flex items-center justify-center">
                      <svg className="w-16 h-16 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-white">{product.name}</h3>
                      <span className="px-2 py-1 text-xs font-medium rounded bg-indigo-900/50 text-indigo-400 border border-indigo-800">
                        {product.category}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xl font-bold text-white">${product.cost}</span>
                        <span className="text-sm text-slate-400 ml-1">{product.currency || "USD"}</span>
                      </div>
                      {purchasedIds.has(product.id) ? (
                        <button
                          disabled
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg opacity-80 text-sm font-medium cursor-not-allowed"
                        >
                          Owned
                        </button>
                      ) : (
                        <button
                          onClick={() => addToCart(product)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors text-sm font-medium"
                        >
                          Add to Cart
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-400">No wallpapers available in this category.</p>
              </div>
            )}

      </div>

      {/* Cart Sidebar */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          <div className="relative ml-auto h-full w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-xl">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-slate-800">
                <h2 className="text-lg font-semibold text-white">Shopping Cart</h2>
                <button
                  onClick={() => setCartOpen(false)}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-16 h-16 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                    </svg>
                    <p className="text-slate-400">Your wallpaper cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="flex gap-4 p-3 bg-slate-800 rounded-lg border border-slate-700"
                      >
                        {item.image_url ? (
                          <img
                            src={proxyImageUrl(item.image_url)}
                            alt={item.name}
                            draggable={false}
                            onContextMenu={(e) => e.preventDefault()}
                            className="w-20 h-20 object-cover rounded select-none"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-slate-700 rounded flex items-center justify-center">
                            <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{item.name}</h4>
                          <p className="text-sm text-slate-400">${item.cost} {item.currency || "USD"}</p>
                          <p className="text-xs text-emerald-400 mt-2">Digital download (single purchase)</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">
                            ${item.cost.toFixed(2)}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-400 text-sm hover:text-red-300 mt-2"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t border-slate-800 p-4 bg-slate-900">
                  {/* Promo Code */}
                  <div className="mb-4">
                    {promoMsg && (
                      <div className={`px-3 py-2 rounded-lg text-xs font-medium mb-2 ${promoMsg.ok ? "bg-emerald-950/60 border border-emerald-800/50 text-emerald-300" : "bg-amber-950/60 border border-amber-800/50 text-amber-300"}`}>
                        {promoMsg.text}
                      </div>
                    )}
                    {promoState ? (
                      <div className="flex items-center justify-between bg-slate-800 border border-emerald-800/50 rounded-lg px-3 py-2">
                        <div>
                          <span className="text-xs font-medium text-emerald-300 uppercase tracking-wider">{promoState.code}</span>
                          <p className="text-xs text-slate-400">-${promoState.amountOff.toFixed(2)} discount applied</p>
                        </div>
                        <button
                          onClick={removePromo}
                          className="text-xs text-red-400 hover:text-red-300 font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                          onKeyDown={(e) => { if (e.key === "Enter") applyPromo(); }}
                          placeholder="Promo code"
                          disabled={promoChecking}
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm font-mono tracking-wider focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                        />
                        <button
                          onClick={applyPromo}
                          disabled={promoChecking || !promoInput.trim()}
                          className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Apply
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400">Subtotal</span>
                    <span className="text-xl font-bold text-white">${cartTotal.toFixed(2)}</span>
                  </div>
                  {promoState && (
                    <div className="flex justify-between items-center mb-1 text-emerald-400">
                      <span className="text-slate-400">Discount</span>
                      <span className="font-semibold">-${promoState.amountOff.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mb-4 border-t border-slate-700 pt-2">
                    <span className="text-slate-400">Total</span>
                    <span className="text-xl font-bold text-white">${Math.max(0, promoTotal).toFixed(2)}</span>
                  </div>
                  <button
                    onClick={handleCheckout}
                    className="w-full py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}