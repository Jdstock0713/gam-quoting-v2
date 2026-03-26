"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { County, PlanType } from "@/types";

type Props = {
  onContinue: (zip: string, county: County, planType: PlanType) => void;
  initialZip?: string;
  initialCounty?: County;
};

const PLAN_TYPE_OPTIONS: { value: PlanType; label: string; icon: string }[] = [
  {
    value: "medigap",
    label: "Medigap (Medicare Supplement)",
    icon: "/images/icon-medigap.png",
  },
  {
    value: "ma",
    label: "Medicare Advantage (Part C)",
    icon: "/images/icon-ma.png",
  },
  {
    value: "pdp",
    label: "Part D (Prescription Drug)",
    icon: "/images/icon-pdp.png",
  },
];

export default function ZipEntry({ onContinue, initialZip, initialCounty }: Props) {
  const zipInputRef = useRef<HTMLInputElement>(null);
  const [zip, setZip] = useState(initialZip ?? "");
  const [county, setCounty] = useState<County | null>(initialCounty ?? null);
  const [allCounties, setAllCounties] = useState<County[]>(initialCounty ? [initialCounty] : []);
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType | null>(
    null
  );
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialZip && zipInputRef.current) {
      zipInputRef.current.value = initialZip;
    }
    if (!initialZip) {
      zipInputRef.current?.focus();
    }
  }, [initialZip]);

  /** Uncontrolled input: read DOM first (embeds / dev tools often desync `value` + state). */
  function digitsFromField(): string {
    const fromRef = (zipInputRef.current?.value ?? "").replace(/\D/g, "").slice(0, 5);
    if (fromRef.length > 0) return fromRef;
    return zip.replace(/\D/g, "").slice(0, 5);
  }

  async function handleZipLookup() {
    const digits = digitsFromField();
    if (digits.length !== 5) {
      setError("Enter a complete 5-digit ZIP code, then click Look Up.");
      setZip(digits);
      zipInputRef.current?.focus();
      return;
    }
    setZip(digits);
    setIsLookingUp(true);
    setError(null);
    setCounty(null);
    setAllCounties([]);
    const ac = new AbortController();
    const t = window.setTimeout(() => ac.abort(), 25000);
    try {
      const apiUrl = `${window.location.origin}/api/counties?zipcode=${encodeURIComponent(digits)}`;
      const res = await fetch(apiUrl, { signal: ac.signal });
      if (!res.ok) throw new Error("Failed to look up ZIP code");
      const data = await res.json();
      const counties = data.counties ?? [];
      if (counties.length === 0) {
        throw new Error("No results found for that ZIP code");
      }
      setAllCounties(counties);
      setCounty(counties[0]);
    } catch (e) {
      const msg =
        e instanceof Error && e.name === "AbortError"
          ? "Look up timed out. Check your connection and try again."
          : e instanceof Error
            ? e.message
            : "Invalid ZIP code. Please try again.";
      setError(msg);
    } finally {
      window.clearTimeout(t);
      setIsLookingUp(false);
    }
  }

  const zipFieldDigits = digitsFromField();
  const zipReady = zipFieldDigits.length === 5;

  return (
    <div className="flex items-start justify-center w-full max-w-lg relative z-10">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 w-full">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 text-center">
          Medicare Quoting
        </h1>
        <p className="text-sm text-gray-500 mb-6 text-center">
          Powered by Medicare.gov
        </p>

        {/* Step 1: ZIP Code */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            1. Enter your ZIP Code
          </label>
          <form
            className="flex flex-wrap sm:flex-nowrap gap-2 items-stretch"
            onSubmit={(e) => {
              e.preventDefault();
              void handleZipLookup();
            }}
          >
            <input
              ref={zipInputRef}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              name="zip"
              id="zip-entry-input"
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 5);
                if (e.target.value !== v) e.target.value = v;
                setZip(v);
                setCounty(null);
                setAllCounties([]);
                setSelectedPlanType(null);
                setError(null);
              }}
              placeholder="12345"
              aria-describedby="zip-entry-hint"
              aria-invalid={!!error}
              className="relative z-[1] flex-1 min-w-0 min-h-[44px] border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLookingUp}
              className={`relative z-[2] pointer-events-auto shrink-0 min-h-[44px] px-5 py-2.5 rounded font-medium transition-colors text-sm sm:min-w-[6.5rem] ${
                isLookingUp
                  ? "bg-blue-500 text-white opacity-80 cursor-wait"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              } ${!zipReady && !isLookingUp ? "ring-2 ring-amber-300 ring-offset-1" : ""}`}
            >
              {isLookingUp ? "Looking up..." : "Look Up"}
            </button>
          </form>
          <p id="zip-entry-hint" className="mt-1.5 text-xs text-gray-500">
            {zipReady
              ? "Press Look Up or Enter to find your county."
              : zipFieldDigits.length === 0
                ? "Enter all 5 digits, then click Look Up."
                : `Enter ${5 - zipFieldDigits.length} more digit${5 - zipFieldDigits.length === 1 ? "" : "s"}, then click Look Up.`}
          </p>
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* County selection (if multiple) */}
        {allCounties.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Select your county
            </label>
            <select
              value={county?.fips ?? ""}
              onChange={(e) => {
                const c = allCounties.find((c) => c.fips === e.target.value);
                if (c) setCounty(c);
              }}
              className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {allCounties.map((c) => (
                <option key={c.fips} value={c.fips}>
                  {c.name} County, {c.state}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* County confirmation */}
        {county && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded px-4 py-3">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">{county.name} County</span>,{" "}
              {county.state}
            </p>
          </div>
        )}

        {/* Step 2: Plan Type Selection */}
        {county && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              2. What type of plan are you looking for?
            </label>
            <div className="space-y-2">
              {PLAN_TYPE_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => {
                    setSelectedPlanType(opt.value);
                    if (county) onContinue(digitsFromField(), county, opt.value);
                  }}
                  className={`w-full text-left rounded-lg border-2 px-3 py-2 transition-colors flex items-center gap-3 ${
                    selectedPlanType === opt.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <Image
                    src={opt.icon}
                    alt=""
                    width={72}
                    height={72}
                    className="shrink-0"
                  />
                  <div className="flex-1 text-center font-semibold text-gray-800 text-base">
                    {opt.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
