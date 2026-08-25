"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { address, generateKeyPair, getAddressFromPublicKey } from "@solana/kit";
import { encodeURL, createQR } from "@solana/pay";

const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const RECIPIENT = process.env.NEXT_PUBLIC_SOLANA_RECIPIENT || "";

interface SolanaPayModalProps {
  open: boolean;
  amount: number;
  label: string;
  message: string;
  onSuccess: (signature: string) => void;
  onError: (msg: string) => void;
  onClose: () => void;
}

export default function SolanaPayModal({ open, amount, label, message, onSuccess, onError, onClose }: SolanaPayModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "waiting" | "polling" | "confirmed" | "error">("idle");
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [paymentUrl, setPaymentUrl] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const startPayment = useCallback(async () => {
    if (!RECIPIENT) {
      onError("Solana recipient address not configured");
      return;
    }

    setStatus("waiting");

    try {
      const keypair = await generateKeyPair();
      const reference = await getAddressFromPublicKey(keypair.publicKey);

      const url = encodeURL({
        recipient: address(RECIPIENT),
        amount,
        reference,
        label,
        message,
      });

      setPaymentUrl(url.toString());

      if (qrRef.current) {
        qrRef.current.innerHTML = "";
        const qr = createQR(url);
        qr.append(qrRef.current);
      }

      setStatus("polling");
      startPolling(reference);
    } catch (err) {
      setStatus("error");
      onError(err instanceof Error ? err.message : "Failed to create payment");
    }
  }, [amount, label, message, onError]);

  const startPolling = useCallback((reference: string) => {
    const controller = new AbortController();
    abortRef.current = controller;

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/payment/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reference,
            recipient: RECIPIENT,
            amount,
          }),
          signal: controller.signal,
        });

        const data = await res.json();

        if (data.verified) {
          stopPolling();
          setStatus("confirmed");
          onSuccess(data.signature);
        }
      } catch {
        // keep polling
      }
    }, 3000);
  }, [amount, onSuccess]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (open) {
      setStatus("idle");
      setPaymentUrl("");
      setCopied(false);
      startPayment();
    } else {
      stopPolling();
    }
    return stopPolling;
  }, [open, startPayment, stopPolling]);

  const copyUrl = () => {
    navigator.clipboard.writeText(paymentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl p-6 w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-100">Pay with Solana</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="text-center mb-4">
          <p className="text-2xl font-bold text-slate-100">${amount.toFixed(2)} USDC</p>
          <p className="text-sm text-slate-400 mt-1">{label}</p>
        </div>

        {status === "error" && (
          <div className="bg-red-950/60 border border-red-800/50 text-red-300 px-4 py-3 rounded-lg text-sm text-center mb-4">
            Payment setup failed. Please try again.
          </div>
        )}

        {status === "confirmed" && (
          <div className="bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 px-4 py-3 rounded-lg text-sm text-center mb-4">
            Payment confirmed!
          </div>
        )}

        <div className="flex justify-center mb-4">
          <div ref={qrRef} className="bg-white rounded-xl p-3" />
        </div>

        <p className="text-xs text-slate-500 text-center mb-4">
          Scan with Phantom, Solflare, or any Solana wallet
        </p>

        {paymentUrl && (
          <button
            onClick={copyUrl}
            className="w-full py-2 text-xs font-medium rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            {copied ? "Copied!" : "Copy Payment Link"}
          </button>
        )}

        {status === "polling" && (
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-400">
            <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Waiting for payment confirmation...
          </div>
        )}
      </div>
    </div>
  );
}
