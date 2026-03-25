"use client";

import { useEffect, useRef, useState } from "react";
import { County, PlanType } from "@/types";

// #region agent log
function dbgZip(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string
) {
  if (typeof window === "undefined") return;
  const payload = {
    sessionId: "0abe76",
    location,
    message,
    data,
    timestamp: Date.now(),
    hypothesisId,
    runId: "post-fix3",
  };
  const body = JSON.stringify(payload);
  const logUrl = `${window.location.origin}/api/debug-client-log`;
  fetch(logUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  }).catch(() => {});
  fetch("http://127.0.0.1:7787/ingest/3f234bfc-a343-4891-ab87-dfc2801c4edd", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "0abe76",
    },
    body,
  }).catch(() => {});
}
// #endregion

type Props = {
  onContinue: (zip: string, county: County, planType: PlanType) => void;
};

const PLAN_TYPE_OPTIONS: { value: PlanType; label: string; desc: string }[] = [
  {
    value: "medigap",
    label: "Medigap (Medicare Supplement)",
    desc: "Supplemental insurance that helps pay costs Original Medicare doesn't cover",
  },
  {
    value: "ma",
    label: "Medicare Advantage (Part C)",
    desc: "An all-in-one alternative to Original Medicare, often including drug coverage",
  },
  {
    value: "pdp",
    label: "Part D (Prescription Drug)",
    desc: "Standalone prescription drug coverage to add to Original Medicare",
  },
];

export default function ZipEntry({ onContinue }: Props) {
  const zipInputRef = useRef<HTMLInputElement>(null);
  const [zip, setZip] = useState("");
  const [county, setCounty] = useState<County | null>(null);
  const [allCounties, setAllCounties] = useState<County[]>([]);
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType | null>(
    null
  );
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // #region agent log
  useEffect(() => {
    dbgZip("ZipEntry.tsx:mount", "ZipEntry mounted", {}, "H5");
    return () => {
      dbgZip("ZipEntry.tsx:unmount", "ZipEntry unmounted", {}, "H5");
    };
  }, []);
  // #endregion

  /** Uncontrolled input: read DOM first (embeds / dev tools often desync `value` + state). */
  function digitsFromField(): string {
    const fromRef = (zipInputRef.current?.value ?? "").replace(/\D/g, "").slice(0, 5);
    if (fromRef.length > 0) return fromRef;
    return zip.replace(/\D/g, "").slice(0, 5);
  }

  async function handleZipLookup() {
    const digits = digitsFromField();
    // #region agent log
    dbgZip(
      "ZipEntry.tsx:handleZipLookup:entry",
      "lookup invoked",
      {
        digitsLen: digits.length,
        stateZipLen: zip.length,
        refLen: zipInputRef.current?.value?.length ?? -1,
      },
      "H1"
    );
    // #endregion
    if (digits.length !== 5) {
      // #region agent log
      dbgZip(
        "ZipEntry.tsx:handleZipLookup:shortZip",
        "bailing: not 5 digits",
        { digitsLen: digits.length },
        "H2"
      );
      // #endregion
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
      // #region agent log
      dbgZip(
        "ZipEntry.tsx:handleZipLookup:fetchStart",
        "calling /api/counties",
        { digitsLen: digits.length },
        "H3"
      );
      // #endregion
      const apiUrl = `${window.location.origin}/api/counties?zipcode=${encodeURIComponent(digits)}`;
      const res = await fetch(apiUrl, { signal: ac.signal });
      // #region agent log
      dbgZip(
        "ZipEntry.tsx:handleZipLookup:fetchResponse",
        "fetch returned",
        { ok: res.ok, status: res.status },
        "H3"
      );
      // #endregion
      if (!res.ok) throw new Error("Failed to look up ZIP code");
      const data = await res.json();
      const counties = data.counties ?? [];
      if (counties.length === 0) {
        throw new Error("No results found for that ZIP code");
      }
      setAllCounties(counties);
      setCounty(counties[0]);
    } catch (e) {
      // #region agent log
      dbgZip(
        "ZipEntry.tsx:handleZipLookup:catch",
        "lookup error",
        {
          name: e instanceof Error ? e.name : "unknown",
          message: e instanceof Error ? e.message : String(e),
        },
        "H3"
      );
      // #endregion
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

  function handleContinue() {
    if (!county || !selectedPlanType) return;
    onContinue(digitsFromField(), county, selectedPlanType);
  }

  const zipFieldDigits = digitsFromField();
  const zipReady = zipFieldDigits.length === 5;

  return (
    <div className="flex items-start justify-center w-full max-w-lg relative z-10">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">
          Golden Age Quoting
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Medicare plan data sourced from Medicare.gov
        </p>

        {/* Step 1: ZIP Code */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            1. Enter your ZIP Code
          </label>
          <form
            className="flex flex-wrap sm:flex-nowrap gap-2 items-stretch"
            onSubmit={(e) => {
              // #region agent log
              dbgZip(
                "ZipEntry.tsx:form:onSubmit",
                "form submit",
                {},
                "H1"
              );
              // #endregion
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
                // #region agent log
                dbgZip(
                  "ZipEntry.tsx:input:onChange",
                  "zip input change",
                  {
                    vLen: v.length,
                    rawLen: e.target.value.length,
                  },
                  "H2"
                );
                // #endregion
                setZip(v);
                setCounty(null);
                setAllCounties([]);
                setSelectedPlanType(null);
                setError(null);
              }}
              onFocus={() => {
                // #region agent log
                dbgZip(
                  "ZipEntry.tsx:input:onFocus",
                  "zip input focus",
                  {
                    stateZipLen: zip.length,
                    refValLen: zipInputRef.current?.value?.length ?? -1,
                  },
                  "H2"
                );
                // #endregion
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
                  onClick={() => setSelectedPlanType(opt.value)}
                  className={`w-full text-left rounded-lg border-2 p-4 transition-colors ${
                    selectedPlanType === opt.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 bg-white"
                  }`}
                >
                  <div className="font-semibold text-gray-800 text-sm">
                    {opt.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Continue button */}
        {county && selectedPlanType && (
          <button
            type="button"
            onClick={handleContinue}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
