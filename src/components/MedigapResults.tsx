"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Quote, QuoteRequest, County } from "@/types";
import { fetchQuotes } from "@/providers/quoteProvider";
import QuoteForm from "./QuoteForm";
import QuoteList from "./QuoteList";
import ComparisonView from "./ComparisonView";
import CarrierSettings from "./CarrierSettings";
import QuoteDetails from "./QuoteDetails";

const CARRIER_PREFS_KEY = "medicare-quoting-carrier-prefs";

type Props = {
  zip: string;
  county: County;
  onBack: () => void;
};

export default function MedigapResults({ zip, county, onBack }: Props) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortAscending, setSortAscending] = useState(true);
  const [detailQuote, setDetailQuote] = useState<Quote | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [hiddenCarriers, setHiddenCarriers] = useState<Set<string>>(new Set());

  const allCarriers = useMemo(
    () => Array.from(new Set(quotes.map((q) => q.carrier))).sort(),
    [quotes]
  );

  const selectedCarriers = useMemo(
    () => new Set(allCarriers.filter((c) => !hiddenCarriers.has(c))),
    [allCarriers, hiddenCarriers]
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CARRIER_PREFS_KEY);
      if (saved) {
        setHiddenCarriers(new Set(JSON.parse(saved) as string[]));
      }
    } catch {
      // Use defaults
    }
  }, []);

  const saveHiddenPrefs = useCallback((hidden: Set<string>) => {
    try {
      localStorage.setItem(CARRIER_PREFS_KEY, JSON.stringify(Array.from(hidden)));
    } catch {
      // Silently fail
    }
  }, []);

  function handleToggleCarrier(carrier: string) {
    setHiddenCarriers((prev) => {
      const next = new Set(prev);
      if (next.has(carrier)) next.delete(carrier);
      else next.add(carrier);
      saveHiddenPrefs(next);
      return next;
    });
  }

  function handleSelectAllCarriers() {
    const empty = new Set<string>();
    setHiddenCarriers(empty);
    saveHiddenPrefs(empty);
  }

  function handleClearAllCarriers() {
    const all = new Set(allCarriers);
    setHiddenCarriers(all);
    saveHiddenPrefs(all);
  }

  async function handleSubmit(request: QuoteRequest) {
    setIsLoading(true);
    setError(null);
    setSelectedIds(new Set());
    try {
      const results = await fetchQuotes(request);
      setQuotes(results);
      if (results.length === 0) {
        setError("No plans found for this ZIP code and plan combination.");
      }
    } catch (e) {
      setQuotes([]);
      setError(
        e instanceof Error ? e.message : "Failed to fetch quotes. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleToggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const filteredQuotes = quotes.filter((q) => selectedCarriers.has(q.carrier));
  const comparisonQuotes = filteredQuotes.filter((q) => selectedIds.has(q.id));

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
          <div>
            <button
              onClick={onBack}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium mb-1"
            >
              &larr; Back to plan selection
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800">
              Medigap (Medicare Supplement)
            </h1>
            <p className="text-xs text-gray-500">
              {county.name} County, {county.state} ({zip})
            </p>
          </div>
          {allCarriers.length > 0 && (
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {showSettings ? "Hide" : "Carrier"} Settings
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6">
            <QuoteForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              initialZip={zip}
            />
            {showSettings && (
              <div className="hidden md:block">
                <CarrierSettings
                  allCarriers={allCarriers}
                  selectedCarriers={selectedCarriers}
                  onToggleCarrier={handleToggleCarrier}
                  onSelectAll={handleSelectAllCarriers}
                  onClearAll={handleClearAllCarriers}
                />
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}
            {comparisonQuotes.length > 0 && (
              <ComparisonView
                quotes={comparisonQuotes}
                onClear={() => setSelectedIds(new Set())}
              />
            )}
            <QuoteList
              quotes={filteredQuotes}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onViewDetails={setDetailQuote}
              sortAscending={sortAscending}
              onToggleSort={() => setSortAscending(!sortAscending)}
            />
          </div>

          {showSettings && (
            <div className="md:hidden">
              <CarrierSettings
                allCarriers={allCarriers}
                selectedCarriers={selectedCarriers}
                onToggleCarrier={handleToggleCarrier}
                onSelectAll={handleSelectAllCarriers}
                onClearAll={handleClearAllCarriers}
              />
            </div>
          )}
        </div>
      </main>

      {detailQuote && (
        <QuoteDetails
          quote={detailQuote}
          onClose={() => setDetailQuote(null)}
        />
      )}
    </div>
  );
}
