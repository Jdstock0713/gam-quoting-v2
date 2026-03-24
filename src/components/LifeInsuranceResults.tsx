"use client";

import { useState, useEffect } from "react";
import { LifeQuoteRequest, LifeComparisonResponse, LifeQuoteResult, LifeIssueType } from "@/types";
import { fetchLifeQuotes } from "@/providers/quoteProvider";
import LifeInsuranceForm from "./LifeInsuranceForm";

// Static carrier website mapping — Compulife API doesn't provide websites
const CARRIER_WEBSITES: Record<string, string> = {
  "Pacific Life Insurance Company": "https://www.pacificlife.com",
  "American Equity Investment Life Ins Co": "https://www.american-equity.com",
  "United of Omaha Life Insurance Company": "https://www.mutualofomaha.com",
  "Americo Financial Life and Annuity Ins.": "https://www.americo.com",
  "Fidelity Life Association": "https://www.fidelitylife.com",
  "Transamerica Life Insurance Company": "https://www.transamerica.com",
  "Gerber Life Insurance Company": "https://www.gerberlife.com",
  "Combined Insurance Company of America": "https://www.combinedinsurance.com",
  "Accendo Insurance Company": "https://www.accendoinsurance.com",
  "Lafayette Life Insurance Company": "https://www.lafayettelife.com",
  "S.USA Life Insurance Company, Inc.": "https://www.susalife.com",
  "GBU Financial Life": "https://www.gbulife.org",
  "Mutual of Omaha": "https://www.mutualofomaha.com",
  "Banner Life Insurance Company": "https://www.lgamerica.com",
  "North American Company": "https://www.northamericancompany.com",
  "Protective Life Insurance Company": "https://www.protective.com",
  "Corebridge Financial": "https://www.corebridgefinancial.com",
  "Lincoln National Life Insurance": "https://www.lfg.com",
  "John Hancock Life Insurance Company": "https://www.johnhancock.com",
  "Nationwide Life Insurance Company": "https://www.nationwide.com",
  "Principal Life Insurance Company": "https://www.principal.com",
  "Prudential Insurance Company": "https://www.prudential.com",
  "Symetra Life Insurance Company": "https://www.symetra.com",
  "SBLI USA Life Insurance Company": "https://www.sbli.com",
  "Foresters Life Insurance": "https://www.foresters.com",
  "Globe Life Inc.": "https://www.globelifeinsurance.com",
  "Security Benefit Life Insurance Company": "https://www.securitybenefit.com",
};

/** Fuzzy match carrier name to known website */
function getCarrierWebsite(company: string): string | null {
  // Exact match first
  if (CARRIER_WEBSITES[company]) return CARRIER_WEBSITES[company];
  // Partial match — check if the carrier name contains a known key
  const lowerCompany = company.toLowerCase();
  for (const [key, url] of Object.entries(CARRIER_WEBSITES)) {
    if (lowerCompany.includes(key.toLowerCase().split(" ")[0]) &&
        lowerCompany.includes(key.toLowerCase().split(" ").slice(-1)[0])) {
      return url;
    }
  }
  return null;
}

export default function LifeInsuranceResults() {
  const [comparisons, setComparisons] = useState<LifeComparisonResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(
    new Set()
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [logos, setLogos] = useState<Record<string, string>>({});
  const [isFinalExpense, setIsFinalExpense] = useState(false);
  const [issueFilter, setIssueFilter] = useState<"all" | "gi" | "si">("all");

  // Admin settings from Supabase
  const [enabledStates, setEnabledStates] = useState<string[]>([]);
  const [enabledCarriers, setEnabledCarriers] = useState<string[]>([]);

  // Load company logos + admin settings on mount
  useEffect(() => {
    fetch("/api/life-logos")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setLogos(data);
      })
      .catch(() => {});

    // Load admin settings
    fetch("/api/admin-settings")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          if (data.enabled_states?.length > 0) setEnabledStates(data.enabled_states);
          if (data.enabled_carriers?.length > 0) setEnabledCarriers(data.enabled_carriers);
        }
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(request: LifeQuoteRequest) {
    setIsLoading(true);
    setError(null);
    setComparisons([]);
    setSelectedForCompare(new Set());
    setIsFinalExpense(!!request.isFinalExpense);
    setIssueFilter("all");
    try {
      const results = await fetchLifeQuotes(request);
      setComparisons(results);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get quotes");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleCompare(id: string) {
    setSelectedForCompare((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function parsePremium(val: string | null): number {
    if (!val) return 0;
    return parseFloat(val.replace(/,/g, "")) || 0;
  }

  function formatDollar(val: string | null): string {
    if (!val) return "—";
    const num = parsePremium(val);
    if (num === 0) return val;
    return `$${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  function getLogoUrl(compProdCode: string): string | null {
    if (!compProdCode || Object.keys(logos).length === 0) return null;
    const compCode = compProdCode.substring(0, 4);
    return logos[compCode] || null;
  }

  // Flatten all results for display
  const allResults = comparisons.flatMap((c) => c.results);

  // Apply issue type filter when in final expense mode
  const filteredResults = isFinalExpense && issueFilter !== "all"
    ? allResults.filter((r) => r.issueType === issueFilter)
    : allResults;

  // Sort by monthly premium if available, else annual
  const sortedResults = [...filteredResults].sort((a, b) => {
    const aVal = parsePremium(a.premiumMonthly) || parsePremium(a.premiumAnnual);
    const bVal = parsePremium(b.premiumMonthly) || parsePremium(b.premiumAnnual);
    return sortDir === "asc" ? aVal - bVal : bVal - aVal;
  });

  // Count GI vs SI for filter badges
  const giCount = allResults.filter((r) => r.issueType === "gi").length;
  const siCount = allResults.filter((r) => r.issueType === "si").length;
  const unknownCount = allResults.filter((r) => r.issueType === "unknown").length;

  const compareResults = allResults.filter((r) =>
    selectedForCompare.has(r.compProdCode)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-20">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Life Insurance Quote
              </h2>
              <LifeInsuranceForm
                onSubmit={handleSubmit}
                isLoading={isLoading}
                enabledStates={enabledStates}
                enabledCarriers={enabledCarriers}
              />
            </div>
          </div>

          {/* Right: Results */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {isLoading && (
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3" />
                <p className="text-gray-600">
                  Fetching life insurance quotes...
                </p>
              </div>
            )}

            {!isLoading && sortedResults.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {sortedResults.length} quote
                    {sortedResults.length !== 1 ? "s" : ""} found
                    {isFinalExpense && issueFilter !== "all" && (
                      <span className="text-gray-400 ml-1">
                        (of {allResults.length} total)
                      </span>
                    )}
                  </p>
                  <button
                    onClick={() =>
                      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                    }
                    className="text-sm text-emerald-700 hover:text-emerald-900 font-medium"
                  >
                    Sort by premium{" "}
                    {sortDir === "asc" ? "↑ Low to High" : "↓ High to Low"}
                  </button>
                </div>

                {/* GI / SI Filter Toggle — only shown for Final Expense queries */}
                {isFinalExpense && (giCount > 0 || siCount > 0) && (
                  <div className="flex items-center gap-2 bg-white rounded-lg shadow px-4 py-3">
                    <span className="text-sm font-semibold text-gray-700 mr-2">
                      Filter:
                    </span>
                    <button
                      onClick={() => setIssueFilter("all")}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                        issueFilter === "all"
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      All ({allResults.length})
                    </button>
                    {siCount > 0 && (
                      <button
                        onClick={() => setIssueFilter("si")}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                          issueFilter === "si"
                            ? "bg-blue-600 text-white"
                            : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                        }`}
                      >
                        Simplified Issue ({siCount})
                      </button>
                    )}
                    {giCount > 0 && (
                      <button
                        onClick={() => setIssueFilter("gi")}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                          issueFilter === "gi"
                            ? "bg-amber-600 text-white"
                            : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                        }`}
                      >
                        Guaranteed Issue ({giCount})
                      </button>
                    )}
                    {unknownCount > 0 && issueFilter === "all" && (
                      <span className="text-xs text-gray-400 ml-1">
                        {unknownCount} unclassified
                      </span>
                    )}
                  </div>
                )}

                {/* Quote Cards */}
                <div className="space-y-3">
                  {sortedResults.map((result, idx) => (
                    <LifeQuoteCard
                      key={`${result.compProdCode}-${idx}`}
                      result={result}
                      isSelected={selectedForCompare.has(result.compProdCode)}
                      onToggleCompare={() =>
                        toggleCompare(result.compProdCode)
                      }
                      formatDollar={formatDollar}
                      logoUrl={getLogoUrl(result.compProdCode)}
                      showIssueType={isFinalExpense}
                    />
                  ))}
                </div>

                {/* Comparison */}
                {compareResults.length >= 2 && (
                  <div className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                      Side-by-Side Comparison ({compareResults.length})
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2 border-gray-200">
                            <th className="text-left py-2 pr-4 text-gray-600 font-semibold">
                              Detail
                            </th>
                            {compareResults.map((r, i) => (
                              <th
                                key={i}
                                className="text-left py-2 px-3 text-gray-800 font-semibold"
                              >
                                {r.company}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="py-2 pr-4 text-gray-600">
                              Product
                            </td>
                            {compareResults.map((r, i) => (
                              <td key={i} className="py-2 px-3">
                                {r.product.trim()}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-2 pr-4 text-gray-600">
                              AM Best
                            </td>
                            {compareResults.map((r, i) => (
                              <td key={i} className="py-2 px-3">
                                {r.amBestId}
                              </td>
                            ))}
                          </tr>
                          {compareResults.some((r) => r.premiumMonthly) && (
                            <tr className="border-b border-gray-100">
                              <td className="py-2 pr-4 text-gray-600">
                                Monthly
                              </td>
                              {compareResults.map((r, i) => (
                                <td
                                  key={i}
                                  className="py-2 px-3 font-bold text-emerald-700"
                                >
                                  {formatDollar(r.premiumMonthly)}
                                </td>
                              ))}
                            </tr>
                          )}
                          <tr className="border-b border-gray-100">
                            <td className="py-2 pr-4 text-gray-600">
                              Annual
                            </td>
                            {compareResults.map((r, i) => (
                              <td key={i} className="py-2 px-3 font-semibold">
                                {formatDollar(r.premiumAnnual)}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-2 pr-4 text-gray-600">
                              Health Class
                            </td>
                            {compareResults.map((r, i) => (
                              <td key={i} className="py-2 px-3 text-xs">
                                {r.healthClass}
                              </td>
                            ))}
                          </tr>
                          {isFinalExpense && (
                            <tr>
                              <td className="py-2 pr-4 text-gray-600">
                                Issue Type
                              </td>
                              {compareResults.map((r, i) => (
                                <td key={i} className="py-2 px-3">
                                  <IssueTypeBadge issueType={r.issueType} />
                                </td>
                              ))}
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {!isLoading &&
              !error &&
              allResults.length === 0 &&
              comparisons.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-gray-500">
                    Fill out the form and click &quot;Get Life Insurance
                    Quotes&quot; to see results.
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Individual Quote Card                                              */
/* ------------------------------------------------------------------ */

function LifeQuoteCard({
  result,
  isSelected,
  onToggleCompare,
  formatDollar,
  logoUrl,
  showIssueType = false,
}: {
  result: LifeQuoteResult;
  isSelected: boolean;
  onToggleCompare: () => void;
  formatDollar: (val: string | null) => string;
  logoUrl: string | null;
  showIssueType?: boolean;
}) {
  const websiteUrl = getCarrierWebsite(result.company);

  return (
    <div
      className={`bg-white rounded-lg shadow p-4 border-2 transition-colors ${
        isSelected
          ? "border-emerald-500 bg-emerald-50/30"
          : "border-transparent hover:border-gray-200"
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="flex-shrink-0 w-16 h-12 flex items-center justify-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={result.company}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs font-bold">
              {result.company.substring(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* Company & Product Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-gray-800 truncate">
              {result.company}
            </h3>
            {result.amBestId && (
              <AmBestPill rating={result.amBestId} />
            )}
            {showIssueType && result.issueType !== "unknown" && (
              <IssueTypeBadge issueType={result.issueType} />
            )}
          </div>
          <p className="text-sm text-gray-600">{result.product.trim()}</p>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs text-gray-400">{result.healthClass}</p>
            {result.categoryTitle && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                {result.categoryTitle}
              </span>
            )}
          </div>
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-600 hover:text-emerald-800 hover:underline mt-1 inline-block"
            >
              Visit carrier website →
            </a>
          )}
        </div>

        {/* Pricing — Monthly big, annual small */}
        <div className="text-right ml-4 flex-shrink-0">
          {result.premiumMonthly ? (
            <>
              <p className="text-2xl font-bold text-emerald-700">
                {formatDollar(result.premiumMonthly)}
              </p>
              <p className="text-xs text-gray-500">per month</p>
              <p className="text-sm text-gray-500 mt-1">
                {formatDollar(result.premiumAnnual)}/yr
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-emerald-700">
                {formatDollar(result.premiumAnnual)}
              </p>
              <p className="text-xs text-gray-500">per year</p>
            </>
          )}
        </div>
      </div>

      {/* Compare checkbox */}
      <div className="mt-3 flex items-center justify-end border-t border-gray-100 pt-3">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleCompare}
            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-gray-600">Compare</span>
        </label>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  AM Best Rating Pill                                                */
/* ------------------------------------------------------------------ */

function AmBestPill({ rating }: { rating: string }) {
  // Color based on rating
  let bgColor = "bg-gray-100 text-gray-700";
  const r = rating.trim().toUpperCase();
  if (r.startsWith("A+") || r === "A++") {
    bgColor = "bg-emerald-100 text-emerald-800";
  } else if (r === "A") {
    bgColor = "bg-green-100 text-green-800";
  } else if (r === "A-") {
    bgColor = "bg-lime-100 text-lime-800";
  } else if (r.startsWith("B+") || r === "B++") {
    bgColor = "bg-yellow-100 text-yellow-800";
  } else if (r.startsWith("B")) {
    bgColor = "bg-amber-100 text-amber-800";
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 ${bgColor}`}
      title={`AM Best Rating: ${rating}`}
    >
      {rating}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Issue Type Badge (GI / SI)                                         */
/* ------------------------------------------------------------------ */

function IssueTypeBadge({ issueType }: { issueType: LifeIssueType }) {
  if (issueType === "gi") {
    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 bg-amber-100 text-amber-800"
        title="Guaranteed Issue — No health questions required"
      >
        GI
      </span>
    );
  }
  if (issueType === "si") {
    return (
      <span
        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold flex-shrink-0 bg-blue-100 text-blue-800"
        title="Simplified Issue — Health questions but no medical exam"
      >
        SI
      </span>
    );
  }
  return null;
}
