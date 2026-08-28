export interface PromoCode {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
}

export interface PromoValidation {
  ok: boolean;
  promo?: PromoCode;
  error?: string;
  amountOff?: number;
  total?: number;
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function calculateDiscount(
  promo: PromoCode,
  subtotal: number
): number {
  if (promo.discount_type === "percent") {
    return Math.round(subtotal * (promo.discount_value / 100) * 100) / 100;
  }
  return Math.min(promo.discount_value, subtotal);
}

export function isPromoExpired(promo: PromoCode): boolean {
  if (!promo.expires_at) return false;
  return new Date(promo.expires_at).getTime() < Date.now();
}

export function validatePromo(promo: PromoCode | null, subtotal: number): PromoValidation {
  if (!promo) {
    return { ok: false, error: "Invalid code." };
  }
  if (!promo.active) {
    return { ok: false, error: "This code is no longer active." };
  }
  if (isPromoExpired(promo)) {
    return { ok: false, error: "This code has expired." };
  }
  if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
    return { ok: false, error: "This code has reached its usage limit." };
  }

  const amountOff = calculateDiscount(promo, subtotal);
  return {
    ok: true,
    promo,
    amountOff,
    total: Math.max(0, subtotal - amountOff),
  };
}
