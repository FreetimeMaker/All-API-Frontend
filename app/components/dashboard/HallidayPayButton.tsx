"use client";
import React, { useCallback, useEffect, useRef } from "react";
import { HallidayPaymentsProvider, useHallidayPayments } from "@halliday-sdk/payments/react";

const HALLIDAY_API_KEY = process.env.NEXT_PUBLIC_HALLIDAY_API_KEY || "";
const DESTINATION = process.env.NEXT_PUBLIC_SOLANA_RECIPIENT || "";
const SOLANA_OUTPUTS = [
  "solana:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "solana:Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  "solana:So11111111111111111111111111111111111111111",
];

interface HallidayPayButtonProps {
  amount: number;
  label: string;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  onSuccess?: (payload?: unknown) => void;
  onError?: (msg: string) => void;
}

export default function HallidayPayButton({ amount, label, disabled, className, children, onSuccess, onError }: HallidayPayButtonProps) {
  if (!HALLIDAY_API_KEY || !DESTINATION) return null;

  return (
    <HallidayPaymentsProvider
      apiKey={HALLIDAY_API_KEY}
      deposit={{ outputs: SOLANA_OUTPUTS, destinationAddress: DESTINATION }}
      customStyles={{
        primaryColor: "#10b981",
        backgroundColor: "#0f172a",
        borderColor: "#1e293b",
        textColor: "#f1f5f9",
        textSecondaryColor: "#94a3b8",
        accentColor: "#6366f1",
        successColor: "#10b981",
        alertColor: "#f87171",
        borderStyle: "DEFAULT",
        backgroundStyle: "BLUR",
        zIndex: 3000,
      }}
      headerTitle="All API Checkout"
    >
      <HallidayPayButtonInner amount={amount} label={label} disabled={disabled} className={className} onSuccess={onSuccess} onError={onError}>
        {children}
      </HallidayPayButtonInner>
    </HallidayPaymentsProvider>
  );
}

function HallidayPayButtonInner({ amount, label, disabled, className, children, onSuccess, onError }: HallidayPayButtonProps) {
  const { openDeposit, isReady, instance } = useHallidayPayments();
  const firedRef = useRef(false);

  useEffect(() => {
    if (!instance) return;
    const offStatus = instance.on("status", (s) => {
      const type = s?.type;
      console.log("Halliday status:", type);
      if (type === "COMPLETE" && !firedRef.current) {
        firedRef.current = true;
        onSuccess?.(s?.payload);
      } else if ((type === "FAILED" || type === "EXPIRED" || type === "TAINTED") && !firedRef.current) {
        firedRef.current = true;
        onError?.(`Halliday payment ${type.toLowerCase()}`);
      }
    });
    const offError = instance.on("error", (e) => {
      console.error("Halliday error:", e);
      if (!firedRef.current) {
        firedRef.current = true;
        onError?.(e?.message || "Halliday payment failed");
      }
    });
    return () => {
      offStatus();
      offError();
    };
  }, [instance, onSuccess, onError]);

  const pay = useCallback(() => {
    if (!openDeposit || !isReady) return;
    firedRef.current = false;
    openDeposit({
      inputFiatValue: { currency: "USD", amount: amount.toFixed(2) },
      locked: true,
    });
  }, [openDeposit, isReady, amount, label]);

  return (
    <button type="button" onClick={pay} disabled={disabled || !isReady} className={className}>
      {children}
    </button>
  );
}