"use client";

import { useState, useRef } from "react";
import { Drug } from "@/types";
import { searchDrugs } from "@/providers/quoteProvider";

export type SelectedDrug = {
  rxcui: string;
  name: string;
  is_generic: boolean;
  /** For now we store a default — future: let user pick dosage NDC */
  ndc?: string;
  quantity: number;
  frequency: string;
};

const FREQUENCY_OPTIONS = [
  { value: "FREQUENCY_30_DAYS", label: "Every month (30 days)" },
  { value: "FREQUENCY_60_DAYS", label: "Every 2 months (60 days)" },
  { value: "FREQUENCY_90_DAYS", label: "Every 3 months (90 days)" },
  { value: "FREQUENCY_180_DAYS", label: "Every 6 months" },
  { value: "FREQUENCY_360_DAYS", label: "Every 12 months" },
];

type Props = {
  drugs: SelectedDrug[];
  onDrugsChange: (drugs: SelectedDrug[]) => void;
};

export default function DrugSearch({ drugs, onDrugsChange }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Drug[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  /** When a generic-to-brand fallback was used, this holds the brand name */
  const [fallbackHint, setFallbackHint] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  function handleQueryChange(value: string) {
    setQuery(value);
    setFallbackHint(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const found = await searchDrugs(value);
        setResults(found.drugs);
        setFallbackHint(found.fallback_used ?? null);
        setShowResults(true);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }

  function addDrug(drug: Drug) {
    // Don't add duplicates
    if (drugs.some((d) => d.rxcui === drug.rxcui)) return;

    onDrugsChange([
      ...drugs,
      {
        rxcui: drug.rxcui,
        name: drug.name,
        is_generic: drug.is_generic,
        quantity: 30,
        frequency: "FREQUENCY_30_DAYS",
      },
    ]);
    setQuery("");
    setShowResults(false);
    setResults([]);
  }

  function removeDrug(rxcui: string) {
    onDrugsChange(drugs.filter((d) => d.rxcui !== rxcui));
  }

  function updateDrug(rxcui: string, updates: Partial<SelectedDrug>) {
    onDrugsChange(
      drugs.map((d) => (d.rxcui === rxcui ? { ...d, ...updates } : d))
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Search for your prescription drugs
        </label>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Start typing a drug name (e.g. metformin)..."
            className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isSearching && (
            <div className="absolute right-3 top-3">
              <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Autocomplete dropdown */}
          {showResults && results.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {fallbackHint && (
                <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-700">
                  Showing results for brand name <strong>{fallbackHint}</strong> (generic name not directly indexed)
                </div>
              )}
              {results.map((drug) => (
                <button
                  key={drug.rxcui}
                  onClick={() => addDrug(drug)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0"
                >
                  <div className="font-medium text-sm text-gray-800">
                    {drug.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {drug.is_generic ? "Generic" : "Brand"}
                    {drug.generic ? ` — generic: ${drug.generic.name}` : ""}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected drugs list */}
      {drugs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600">
            Your Drug List ({drugs.length})
          </h4>
          {drugs.map((drug) => (
            <div
              key={drug.rxcui}
              className="bg-gray-50 border border-gray-200 rounded-lg p-3"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-semibold text-sm text-gray-800">
                    {drug.name}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {drug.is_generic ? "(Generic)" : "(Brand)"}
                  </span>
                </div>
                <button
                  onClick={() => removeDrug(drug.rxcui)}
                  className="text-red-500 hover:text-red-700 text-xs font-medium"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Quantity</label>
                  <input
                    type="number"
                    value={drug.quantity}
                    onChange={(e) =>
                      updateDrug(drug.rxcui, {
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    min={1}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Frequency</label>
                  <select
                    value={drug.frequency}
                    onChange={(e) =>
                      updateDrug(drug.rxcui, { frequency: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                  >
                    {FREQUENCY_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
