"use client";

import { useState, useRef } from "react";
import { Provider } from "@/types";
import { searchProviders } from "@/providers/quoteProvider";

export type SelectedProvider = {
  npi: string;
  name: string;
  credential: string;
  specialty: string;
  city: string;
  state: string;
};

type Props = {
  /** State abbreviation to narrow search (from county) */
  searchState?: string;
  providers: SelectedProvider[];
  onProvidersChange: (providers: SelectedProvider[]) => void;
};

export default function ProviderSearch({
  searchState,
  providers,
  onProvidersChange,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Provider[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length < 2) {
      setResults([]);
      setShowResults(false);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const found = await searchProviders(value, searchState);
        setResults(found);
        setShowResults(true);
        setSearched(true);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  }

  function addProvider(prov: Provider) {
    if (providers.some((p) => p.npi === prov.npi)) return;

    onProvidersChange([
      ...providers,
      {
        npi: prov.npi,
        name: `${prov.first_name} ${prov.last_name}`.trim(),
        credential: prov.credential,
        specialty: prov.specialty,
        city: prov.city,
        state: prov.state,
      },
    ]);
    setQuery("");
    setShowResults(false);
    setResults([]);
    setSearched(false);
  }

  function removeProvider(npi: string) {
    onProvidersChange(providers.filter((p) => p.npi !== npi));
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Search for your doctors and specialists
        </label>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Type a doctor's name (e.g. John Smith)..."
            className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {isSearching && (
            <div className="absolute right-3 top-3">
              <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Results dropdown */}
          {showResults && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {results.length === 0 && searched && (
                <div className="px-3 py-3 text-sm text-gray-500">
                  No providers found. Try a different name or spelling.
                </div>
              )}
              {results.map((prov) => {
                const already = providers.some((p) => p.npi === prov.npi);
                return (
                  <button
                    key={prov.npi}
                    onClick={() => addProvider(prov)}
                    disabled={already}
                    className={`w-full text-left px-3 py-2 border-b border-gray-100 last:border-0 ${
                      already
                        ? "opacity-50 cursor-not-allowed bg-gray-50"
                        : "hover:bg-blue-50"
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-800">
                      {prov.first_name} {prov.last_name}
                      {prov.credential && (
                        <span className="text-gray-500 font-normal">
                          , {prov.credential}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {prov.specialty || "Provider"}
                      {prov.city &&
                        ` — ${prov.city}, ${prov.state} ${prov.zip}`}
                    </div>
                    {already && (
                      <span className="text-xs text-blue-600">
                        Already added
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Selected providers list */}
      {providers.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600">
            Your Providers ({providers.length})
          </h4>
          {providers.map((prov) => (
            <div
              key={prov.npi}
              className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-start justify-between"
            >
              <div>
                <span className="font-semibold text-sm text-gray-800">
                  {prov.name}
                  {prov.credential && (
                    <span className="text-gray-500 font-normal">
                      , {prov.credential}
                    </span>
                  )}
                </span>
                <div className="text-xs text-gray-500">
                  {prov.specialty || "Provider"}
                  {prov.city && ` — ${prov.city}, ${prov.state}`}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  NPI: {prov.npi}
                </div>
              </div>
              <button
                onClick={() => removeProvider(prov.npi)}
                className="text-red-500 hover:text-red-700 text-xs font-medium ml-2"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
