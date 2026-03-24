"use client";

import { useState } from "react";
import { County, PlanType } from "@/types";

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
  const [zip, setZip] = useState("");
  const [county, setCounty] = useState<County | null>(null);
  const [allCounties, setAllCounties] = useState<County[]>([]);
  const [selectedPlanType, setSelectedPlanType] = useState<PlanType | null>(
    null
  );
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleZipLookup() {
    if (zip.length !== 5) return;
    setIsLookingUp(true);
    setError(null);
    setCounty(null);
    setAllCounties([]);
    try {
      const res = await fetch(`/api/counties?zipcode=${encodeURIComponent(zip)}`);
      if (!res.ok) throw new Error("Failed to look up ZIP code");
      const data = await res.json();
      const counties = data.counties ?? [];
      if (counties.length === 0) {
        throw new Error("No results found for that ZIP code");
      }
      setAllCounties(counties);
      setCounty(counties[0]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Invalid ZIP code. Please try again."
      );
    } finally {
      setIsLookingUp(false);
    }
  }

  function handleContinue() {
    if (!county || !selectedPlanType) return;
    onContinue(zip, county, selectedPlanType);
  }

  return (
    <div className="flex items-start justify-center pt-16">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full mx-4">
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
          <div className="flex gap-2">
            <input
              type="text"
              value={zip}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 5);
                setZip(v);
                setCounty(null);
                setAllCounties([]);
                setSelectedPlanType(null);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleZipLookup();
                }
              }}
              placeholder="48383"
              className="flex-1 border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleZipLookup}
              disabled={zip.length !== 5 || isLookingUp}
              className="bg-blue-600 text-white px-5 py-2.5 rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {isLookingUp ? "Looking up..." : "Look Up"}
            </button>
          </div>
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
              {county.state} (FIPS: {county.fips})
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
