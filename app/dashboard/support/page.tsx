"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface FaqItem {
  q: string;
  a: string;
}

interface SupportResponse {
  ok?: boolean;
  saved?: boolean;
  notificationSent?: boolean;
  error?: string;
}

const faqs: FaqItem[] = [
  {
    q: "How do I buy wallpapers from the shop?",
    a: "Open the Shop, go to the Wallpapers tab, add the wallpapers you want to your cart, then proceed to checkout. Payment is handled securely via Solana Pay — scan the QR code with any Solana wallet (Phantom, Solflare, etc.).",
  },
  {
    q: "How do GeoWeather subscriptions work?",
    a: "Head to the Shop and open the GeoWeather Subscriptions tab. Pick a plan and pay for it with Solana Pay. If you have a promo or gift code, you can redeem it on the same page to activate a plan.",
  },
  {
    q: "How do I use a promo code?",
    a: "In the wallpaper cart, enter your code in the Promo field before checking out — the discount is applied to your total automatically. For GeoWeather, use the Redeem a Code box in the Subscriptions tab.",
  },
  {
    q: "Where can I find my purchased wallpapers?",
    a: "After a successful purchase you'll be redirected to your dashboard, where your purchased wallpapers are listed under Purchased Wallpapers.",
  },
  {
    q: "My payment failed or an order didn't go through. What should I do?",
    a: "Double-check that you've confirmed the transaction in your wallet and that you have enough SOL for the transaction fee. If it still doesn't appear, contact us using the form below and include your wallet address.",
  },
];

export default function SupportPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data: { user } }: { data: { user: User | null } }) => {
        setUser(user);
        setLoading(false);
      });
  }, [supabase]);

  const clearForm = () => {
    setSubject("");
    setMessage("");
    setSent(true);
    setTimeout(() => setSent(false), 8000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      setError("Please enter a message.");
      return;
    }

    setSending(true);
    setError(null);
    setSent(false);

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          message: message.trim(),
        }),
      });

      const result = (await response.json()) as SupportResponse;

      if (!response.ok) {
        if (result.saved) {
          clearForm();
          setError(
            result.error ||
              "Your request was saved, but the email notification could not be sent."
          );
        } else {
          setError(result.error || "There was a problem submitting your request. Please try again.");
        }
        return;
      }

      clearForm();
    } catch (submitError) {
      console.error("Support request failed:", submitError);
      setError("There was a problem submitting your request. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <svg className="h-6 w-6 animate-spin text-slate-400" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    );
  }

  if (!user) return null;

  const categories = ["General", "Payments", "GeoWeather", "Wallpapers", "Promo Codes", "Bug Report", "Other"];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-100">Support</h1>
        <p className="text-slate-400">We&apos;re here to help. Browse the FAQs or send us a message.</p>
      </header>

      <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 px-4 py-3">
        <p className="text-sm text-indigo-200">
          Every message sent through this form is stored as a support ticket and also forwarded to our support inbox by email.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <a
          href="mailto:FreetimeMaker@proton.me"
          className="rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-sm transition-colors hover:border-slate-600"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-900/50">
              <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">Email</p>
              <p className="text-xs text-slate-400">FreetimeMaker@proton.me</p>
            </div>
          </div>
        </a>

        <a
          href="https://github.com/FreetimeMaker/All-API-Frontend/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-sm transition-colors hover:border-slate-600"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700">
              <svg className="h-5 w-5 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">GitHub Issues</p>
              <p className="text-xs text-slate-400">Report a bug or request a feature</p>
            </div>
          </div>
        </a>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm">
        <div className="border-b border-slate-700 p-4">
          <h2 className="font-semibold text-slate-100">Contact Us</h2>
          <p className="mt-0.5 text-xs text-slate-400">Send us a support request and we&apos;ll get back to you.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {sent && (
            <div className="rounded-lg border border-emerald-800/50 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-300">
              Your request has been submitted and the support notification was processed.
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-amber-800/50 bg-amber-950/60 px-3 py-2 text-sm text-amber-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-300">Subject</label>
              <input
                type="text"
                maxLength={160}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Short summary (optional)"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={10000}
              rows={5}
              placeholder="Describe your issue or question..."
              className="w-full resize-y rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-slate-500">Signed in as {user.email || "guest"}</p>
            <button
              type="submit"
              disabled={sending}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Request"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slate-700 bg-slate-800 shadow-sm">
        <div className="border-b border-slate-700 p-4">
          <h2 className="font-semibold text-slate-100">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3 p-4">
          {faqs.map((faq, i) => {
            const open = openFaq === i;
            return (
              <div key={i} className="overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
                <button
                  type="button"
                  onClick={() => setOpenFaq(open ? null : i)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                  <span className="text-sm font-medium text-slate-100">{faq.q}</span>
                  <svg
                    className={`h-4 w-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {open && <div className="px-4 pb-4 text-sm leading-relaxed text-slate-400">{faq.a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
