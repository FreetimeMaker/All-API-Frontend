"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { proxyImageUrl } from "@/lib/proxy-image";
import { validatePromo, normalizeCode } from "@/lib/promo-codes";
import SolanaPayModal from "../../components/dashboard/SolanaPayModal";
import Spinner from "../../components/Spinner";

const HallidayPayButton = dynamic(() => import("../../components/dashboard/HallidayPayButton"), { ssr: false });

interface CartItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  currency?: string;
  category: string;
  image_url: string;
  quantity: number;
}

export default function CheckoutPage() {
  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [promo, setPromo] = useState<{ code: string; amountOff: number; total: number } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const loadPromo = async (cartData: CartItem[]) => {
    const savedPromo = localStorage.getItem("wallora_checkout_promo");
    if (!savedPromo) return;

    try {
      const { code } = JSON.parse(savedPromo);
      if (!code) return;

      const { data } = await supabase
        .from("promo_codes")
        .select("id, code, discount_type, discount_value, max_uses, used_count, expires_at, active")
        .ilike("code", normalizeCode(code))
        .maybeSingle();

      const subtotal = cartData.reduce((t: number, item: CartItem) => t + item.cost, 0);
      const result = validatePromo(data as any, subtotal);
      if (result.ok && result.amountOff !== undefined && result.total !== undefined) {
        setPromo({ code: result.promo!.code, amountOff: result.amountOff, total: result.total });
      }
    } catch {
      // ignore invalid promo payload
    }
  };

  useEffect(() => {
    // Check authentication
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        // Load cart from localStorage
        const savedCart = localStorage.getItem("wallora_wallpaper_cart");
        if (savedCart) {
          const cartData = JSON.parse(savedCart);
          if (cartData.length === 0) {
            router.push("/shop");
          } else {
            setCart(cartData);
            // Load promo code carried over from the cart sidebar
            loadPromo(cartData);
          }
        } else {
          router.push("/shop");
        }
        setLoading(false);
      }
    });
  }, [router, supabase]);

  const cartTotal = cart.reduce(
    (total, item) => total + item.cost,
    0
  );
  const discountAmount = promo ? promo.amountOff : 0;
  const checkoutTotal = Math.max(0, cartTotal - discountAmount);

  const createOrder = async () => {
    setProcessing(true);
    setError(null);

    try {
      // Create order through Wallora endpoint
      const orderData = {
        userId: user.id,
        items: cart.map(item => ({
          wallpaperId: item.id,
          quantity: 1, // Always 1 for single purchase
          cost: item.cost
        })),
        total: checkoutTotal,
        currency: cart[0]?.currency || "USD"
      };

      const response = await fetch("/api/proxy/v1/wallora/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error("Failed to create order");
      }

      const order = await response.json();
      console.log("Order created successfully:", order);

      // Update user metadata with purchase BEFORE clearing cart
      const { data: { user: updatedUser }, error: updateError } = await supabase.auth.updateUser({
        data: { 
          purchases: [
            ...(user.user_metadata?.purchases || []),
            ...cart.map(item => ({
              wallpaperId: item.id,
              name: item.name,
              cost: item.cost,
              image_url: item.image_url,
              category: item.category,
              purchasedAt: new Date().toISOString()
            }))
          ]
        }
      });

      if (updateError) {
        console.error("Error updating user metadata:", updateError);
        // Don't throw error, continue with order success
        console.warn("Continuing without metadata update");
      } else {
        console.log("User metadata updated successfully");
      }

      // Increment promo code usage count if a code was applied
      if (promo) {
        const { data: promoRow } = await supabase
          .from("promo_codes")
          .select("used_count")
          .ilike("code", promo.code)
          .maybeSingle();
        const currentCount = promoRow?.used_count ?? 0;
        await supabase
          .from("promo_codes")
          .update({ used_count: currentCount + 1 })
          .eq("code", promo.code);
      }

      // Clear cart + promo only after successful order
      localStorage.removeItem("wallora_wallpaper_cart");
      localStorage.removeItem("wallora_checkout_promo");
      setCart([]);
      setPromo(null);

      setSuccess(true);
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setProcessing(false);
    }
  };

  const handlePaymentSuccess = () => {
    setShowPayModal(false);
    createOrder();
  };

  const handlePaymentError = (msg: string) => {
    setShowPayModal(false);
    setError(`Payment failed: ${msg}`);
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center bg-slate-950">
        <Spinner />
      </div>
    );
  }

  if (!user) return null;

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-900/50 flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Order Placed Successfully!</h2>
          <p className="text-slate-400 mb-6">Thank you for your purchase. You will be redirected to your dashboard shortly.</p>
          <div className="animate-pulse text-sm text-slate-500">Redirecting...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 min-h-screen">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => router.push("/shop")}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Shop
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Wallpaper Order Summary</h2>
              
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 bg-slate-800 rounded-lg border border-slate-700"
                  >
                    {item.image_url ? (
                      <img
                        src={proxyImageUrl(item.image_url)}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-slate-700 rounded flex items-center justify-center">
                        <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{item.name}</h3>
                      <p className="text-sm text-slate-400">{item.category}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-slate-400">Qty: 1</span>
                        <span className="font-semibold text-white">
                          ${item.cost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-white mb-6">Order Details</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-white">${cartTotal.toFixed(2)}</span>
                </div>
                {promo && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount ({promo.code})</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Tax</span>
                  <span className="text-white">$0.00</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Shipping</span>
                  <span className="text-white">$0.00</span>
                </div>
                <div className="border-t border-slate-700 pt-4 flex justify-between">
                  <span className="text-lg font-semibold text-white">Total</span>
                  <span className="text-lg font-bold text-white">${checkoutTotal.toFixed(2)}</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={() => { setError(null); setShowPayModal(true); }}
                disabled={processing || cart.length === 0}
                className="w-full mt-6 py-3 bg-[#9945FF] text-white rounded-lg hover:bg-[#8833EE] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2.5 5.5L8 2L13.5 5.5V10.5L8 14L2.5 10.5V5.5Z" fill="white" />
                </svg>
                {processing ? "Processing..." : `Pay $${checkoutTotal.toFixed(2)} with Solana`}
              </button>

              <p className="mt-3 text-center text-xs text-slate-500">Your order is created after the payment is confirmed.</p>

              <HallidayPayButton
                amount={checkoutTotal}
                label="Wallora Wallpapers"
                disabled={processing || cart.length === 0}
                onSuccess={handlePaymentSuccess}
                onError={(m) => setError(`Payment failed: ${m}`)}
                className="w-full mt-2 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Or pay ${checkoutTotal.toFixed(2)} with Card / Crypto
              </HallidayPayButton>
            </div>
          </div>
        </div>
      </div>

      <SolanaPayModal
        open={showPayModal}
        amount={checkoutTotal}
        label="Wallora Wallpapers"
        message={`Purchase ${cart.length} wallpaper${cart.length === 1 ? "" : "s"}`}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        onClose={() => setShowPayModal(false)}
      />
    </div>
  );
}