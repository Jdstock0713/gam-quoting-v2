import type { LifeQuoteResult } from "@/types";

export type LimitedPayPlan =
  | { kind: "single" }
  | { kind: "installment"; count: number };

function parseNum(s: string | null | undefined): number {
  if (!s) return 0;
  return parseFloat(s.replace(/,/g, "")) || 0;
}

/** Compulife sometimes returns placeholder rows with no premium — hide them in the UI. */
export function hasValidLifeQuoteResult(r: LifeQuoteResult): boolean {
  if (!r.company?.trim() || !r.product?.trim()) return false;
  return (
    parseNum(r.premiumAnnual) > 0 ||
    parseNum(r.premiumMonthly) > 0 ||
    parseNum(r.premiumQuarterly) > 0 ||
    parseNum(r.premiumSemiAnnual) > 0
  );
}

/**
 * Detect Single Pay / N-Pay from Compulife comparison title or product name.
 * Uses 1–2 digit pay counts only so "To Age 121" does not read as "12 pay".
 */
export function parseLimitedPayPlan(
  categoryTitle: string | undefined,
  product: string | undefined
): LimitedPayPlan | null {
  const text = [categoryTitle, product].filter(Boolean).join(" ");
  if (!text) return null;

  if (/\b(?:single|one)[\s\u2010-\u2014\-]+pay\b/i.test(text)) {
    return { kind: "single" };
  }
  if (/\b1[\s\u2010-\u2014\-]*pay\b/i.test(text)) {
    return { kind: "single" };
  }

  const m = text.match(
    /\b([1-9]|[12][0-9])[\s\u2010-\u2014\-]*pay\b/i
  );
  if (m) {
    const n = parseInt(m[1], 10);
    if (n === 1) return { kind: "single" };
    if (n >= 2 && n <= 30) return { kind: "installment", count: n };
  }
  return null;
}

export function premiumSortValue(result: LifeQuoteResult): number {
  const plan = parseLimitedPayPlan(result.categoryTitle, result.product);
  const annual = parseNum(result.premiumAnnual);
  const monthly = parseNum(result.premiumMonthly);

  if (plan?.kind === "single") {
    return annual;
  }
  if (plan?.kind === "installment") {
    return annual;
  }
  if (monthly > 0) return monthly;
  return annual / 12;
}

export type PremiumDisplayLines = {
  primary: string;
  primarySub?: string;
  /** e.g. annual total when primary is monthly */
  secondary?: string;
};

/**
 * Card / table copy for standard vs single / limited pay.
 * For single / N-pay, Compulife's premiumAnnual is the modal (one lump or one check);
 * premiumMonthly is often annual÷12 and is hidden for those rows.
 */
export function getPremiumDisplayLines(
  result: LifeQuoteResult,
  formatDollar: (val: string | null) => string
): PremiumDisplayLines {
  const plan = parseLimitedPayPlan(result.categoryTitle, result.product);
  const annualStr = result.premiumAnnual || null;

  if (plan?.kind === "single") {
    return {
      primary: `Single payment of ${formatDollar(annualStr)}`,
    };
  }

  if (plan?.kind === "installment") {
    return {
      primary: `${plan.count} payments of ${formatDollar(annualStr)}`,
    };
  }

  if (result.premiumMonthly) {
    return {
      primary: formatDollar(result.premiumMonthly),
      primarySub: "per month",
      secondary: `${formatDollar(annualStr)}/yr`,
    };
  }

  return {
    primary: formatDollar(annualStr),
    primarySub: "per year",
  };
}
