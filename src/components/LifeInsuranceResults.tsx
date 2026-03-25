"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { LifeQuoteRequest, LifeComparisonResponse, LifeQuoteResult, LifeIssueType } from "@/types";
import { fetchLifeQuotes } from "@/providers/quoteProvider";
import {
  hasValidLifeQuoteResult,
  parseLimitedPayPlan,
  premiumSortValue,
} from "@/lib/lifePremiumDisplay";
import LifeInsuranceForm, {
  formatLifeFaceAmountDisplay,
  formatLifeQuoteRunSummary,
  getLifeInsuranceCategoryLabel,
  getLifeQuotedHealthLabel,
} from "./LifeInsuranceForm";
import LifeCompareModal from "./LifeCompareModal";

const MAX_COMPARE_QUOTES = 5;

/** Frozen at checkbox time — premiums & request context do not change when the user re-quotes */
type CompareSnapshot = {
  id: string;
  result: LifeQuoteResult;
  request: LifeQuoteRequest;
  isFinalExpense: boolean;
};

/** Stable React key within a single results list (compProdCode alone can collide across merged responses). */
function lifeQuoteRowId(r: LifeQuoteResult): string {
  return [r.compProdCode, r.company, r.product].join("|");
}

/** Unique id for compare snapshots — product identity plus full quoted request so the same carrier/product at different coverage/health/term/etc. is distinct. */
function compareSnapshotId(r: LifeQuoteResult, req: LifeQuoteRequest): string {
  return [
    r.compProdCode,
    r.company,
    r.product,
    req.state,
    req.birthMonth,
    req.birthDay,
    req.birthYear,
    req.gender,
    req.smoker,
    req.health,
    req.category,
    req.faceAmount,
    req.mode,
    req.isFinalExpense ? "1" : "0",
    req.compInc ?? "",
  ].join("|");
}

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

function LifeCompareQueueSection({
  showOuterCard,
  quotedRequestKey,
  compareSnapshots,
  onOpenModal,
  onRemove,
  onClearAll,
}: {
  showOuterCard: boolean;
  quotedRequestKey: string | null;
  compareSnapshots: CompareSnapshot[];
  onOpenModal: () => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}) {
  if (!quotedRequestKey) return null;
  const compact = !showOuterCard;
  const inner = (
    <>
      <p
        className={
          compact
            ? "text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5"
            : "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2"
        }
      >
        Compare
      </p>
      <button
        type="button"
        disabled={compareSnapshots.length < 2}
        onClick={onOpenModal}
        className={`w-full rounded-lg font-semibold transition-all ${
          compact
            ? "py-2 px-2 text-xs"
            : "py-2.5 px-4 text-sm"
        } ${
          compareSnapshots.length >= 2
            ? compact
              ? "bg-emerald-600 text-white shadow-sm ring-1 ring-amber-300/90 ring-offset-1 hover:bg-emerald-700"
              : "bg-emerald-600 text-white shadow-md ring-2 ring-amber-300 ring-offset-2 hover:bg-emerald-700"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        Compare Quotes ({compareSnapshots.length})
      </button>
      {compareSnapshots.length >= MAX_COMPARE_QUOTES && (
        <p
          className={
            compact
              ? "text-[10px] text-amber-700 mt-1.5 leading-snug"
              : "text-xs text-amber-700 mt-2"
          }
        >
          Maximum {MAX_COMPARE_QUOTES} quotes can be compared.
        </p>
      )}
      {compareSnapshots.length > 0 ? (
        <>
          <ul
            className={
              compact
                ? "mt-2 space-y-1.5 border-t border-gray-100 pt-2"
                : "mt-3 space-y-2 border-t border-gray-100 pt-3"
            }
          >
            {compareSnapshots.map((snap) => (
              <li
                key={snap.id}
                className={
                  compact
                    ? "flex items-start justify-between gap-1.5 text-[10px] rounded-md p-1.5 bg-gray-50 border border-gray-100"
                    : "flex items-start justify-between gap-2 text-xs rounded-md p-2 bg-gray-50 border border-gray-100"
                }
              >
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate leading-tight">
                    {snap.result.company}
                  </p>
                  <p className="text-gray-600 truncate leading-tight">
                    {snap.result.product.trim()}
                  </p>
                  <p
                    className={
                      compact
                        ? "text-gray-500 mt-0.5 leading-snug line-clamp-2"
                        : "text-gray-500 mt-1 leading-snug line-clamp-2"
                    }
                    title={`${getLifeQuotedHealthLabel(snap.request.health)} · ${getLifeInsuranceCategoryLabel(snap.request.category)} · Saved at ${formatLifeFaceAmountDisplay(snap.request.faceAmount)}`}
                  >
                    {getLifeQuotedHealthLabel(snap.request.health)} ·{" "}
                    {getLifeInsuranceCategoryLabel(snap.request.category)} ·
                    Saved at{" "}
                    {formatLifeFaceAmountDisplay(snap.request.faceAmount)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${snap.result.company} from compare`}
                  onClick={() => onRemove(snap.id)}
                  className={
                    compact
                      ? "flex-shrink-0 text-gray-400 hover:text-red-600 font-bold text-base leading-none px-0.5"
                      : "flex-shrink-0 text-gray-400 hover:text-red-600 font-bold text-lg leading-none px-1"
                  }
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-medium text-gray-500 hover:text-red-600 underline"
            >
              Clear all comparisons
            </button>
          </div>
        </>
      ) : (
        <p
          className={
            compact
              ? "text-[10px] text-gray-500 mt-1.5 leading-snug"
              : "text-xs text-gray-500 mt-2"
          }
        >
          Use the Compare button on a quote card to add it here (up to{" "}
          {MAX_COMPARE_QUOTES}).
        </p>
      )}
    </>
  );
  if (showOuterCard) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200 shrink-0">
        {inner}
      </div>
    );
  }
  return <div className="min-w-0">{inner}</div>;
}

function LifeQuoteFormSection({
  showOuterCard,
  onSubmit,
  isLoading,
  enabledStates,
  enabledCarriers,
  quotedRequestKey,
}: {
  showOuterCard: boolean;
  onSubmit: (request: LifeQuoteRequest) => void;
  isLoading: boolean;
  enabledStates: string[];
  enabledCarriers: string[];
  quotedRequestKey: string | null;
}) {
  const sidebar = !showOuterCard;
  const inner = (
    <>
      <h2
        className={
          sidebar
            ? "text-base font-bold text-gray-800 mb-2.5"
            : "text-lg font-bold text-gray-800 mb-4"
        }
      >
        Life Insurance Quote
      </h2>
      <LifeInsuranceForm
        onSubmit={onSubmit}
        isLoading={isLoading}
        enabledStates={enabledStates}
        enabledCarriers={enabledCarriers}
        quotedRequestKey={quotedRequestKey}
        density={sidebar ? "dense" : "comfortable"}
      />
    </>
  );
  if (showOuterCard) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 shrink-0">{inner}</div>
    );
  }
  return <div className="min-w-0">{inner}</div>;
}

export default function LifeInsuranceResults() {
  const [comparisons, setComparisons] = useState<LifeComparisonResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compareSnapshots, setCompareSnapshots] = useState<CompareSnapshot[]>(
    []
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [logos, setLogos] = useState<Record<string, string>>({});
  const [isFinalExpense, setIsFinalExpense] = useState(false);
  const [issueFilter, setIssueFilter] = useState<"all" | "gi" | "si">("all");

  // Admin settings from Supabase
  const [enabledStates, setEnabledStates] = useState<string[]>([]);
  const [enabledCarriers, setEnabledCarriers] = useState<string[]>([]);
  /** Serialized request that produced the current results (null until first success). */
  const [quotedRequestKey, setQuotedRequestKey] = useState<string | null>(null);
  const [lastQuoteRequest, setLastQuoteRequest] =
    useState<LifeQuoteRequest | null>(null);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  /** Desktop (lg+): open by default so the quote form is visible on first visit; user can collapse anytime. */
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  /** After the first successful quote this mount, tuck the sidebar to the standard icon rail for results. */
  const didAutoCollapseAfterFirstQuoteRef = useRef(false);
  const [sidebarPanel, setSidebarPanel] = useState<"quote" | "compare">(
    "quote"
  );

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
    setIsFinalExpense(!!request.isFinalExpense);
    setIssueFilter("all");
    try {
      const results = await fetchLifeQuotes(request);
      setComparisons(results);
      setLastQuoteRequest(request);
      setQuotedRequestKey(
        JSON.stringify({
          state: request.state,
          birthMonth: request.birthMonth,
          birthDay: request.birthDay,
          birthYear: request.birthYear,
          gender: request.gender,
          smoker: request.smoker,
          health: request.health,
          category: request.category,
          faceAmount: request.faceAmount,
          mode: request.mode,
          isFinalExpense: !!request.isFinalExpense,
          compInc: request.compInc ?? "",
        })
      );
      if (!didAutoCollapseAfterFirstQuoteRef.current) {
        didAutoCollapseAfterFirstQuoteRef.current = true;
        setSidebarExpanded(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to get quotes");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleCompareFromCard(result: LifeQuoteResult) {
    if (!lastQuoteRequest) return;
    const request = lastQuoteRequest;
    const snapId = compareSnapshotId(result, request);
    const existingIdx = compareSnapshots.findIndex((s) => s.id === snapId);
    if (existingIdx >= 0) {
      setCompareSnapshots((prev) =>
        prev.filter((_, i) => i !== existingIdx)
      );
      return;
    }
    if (compareSnapshots.length >= MAX_COMPARE_QUOTES) return;
    const isFirstAdd = compareSnapshots.length === 0;
    setCompareSnapshots((prev) => [
      ...prev,
      {
        id: snapId,
        result: { ...result },
        request: { ...request },
        isFinalExpense: !!request.isFinalExpense,
      },
    ]);
    if (isFirstAdd) {
      setSidebarExpanded(true);
      setSidebarPanel("compare");
    }
  }

  function removeCompareSnapshot(id: string) {
    setCompareSnapshots((prev) => prev.filter((s) => s.id !== id));
  }

  function clearAllCompareSnapshots() {
    setCompareSnapshots([]);
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

  // Flatten and drop blank Compulife rows (no premium / missing identity)
  const allResults = comparisons
    .flatMap((c) => c.results)
    .filter(hasValidLifeQuoteResult);

  // Apply issue type filter when in final expense mode
  const filteredResults = isFinalExpense && issueFilter !== "all"
    ? allResults.filter((r) => r.issueType === issueFilter)
    : allResults;

  // Sort by monthly premium if available, else annual
  const sortedResults = [...filteredResults].sort((a, b) => {
    const aVal = premiumSortValue(a);
    const bVal = premiumSortValue(b);
    return sortDir === "asc" ? aVal - bVal : bVal - aVal;
  });

  // Count GI vs SI for filter badges
  const giCount = allResults.filter((r) => r.issueType === "gi").length;
  const siCount = allResults.filter((r) => r.issueType === "si").length;
  const unknownCount = allResults.filter((r) => r.issueType === "unknown").length;

  const compareModalColumns = useMemo(
    () =>
      compareSnapshots.map(({ result, request, isFinalExpense }) => ({
        result,
        request,
        isFinalExpense,
      })),
    [compareSnapshots]
  );

  useEffect(() => {
    if (compareSnapshots.length < 2) setCompareModalOpen(false);
  }, [compareSnapshots.length]);

  useEffect(() => {
    if (compareSnapshots.length === 0 && sidebarPanel === "compare") {
      setSidebarPanel("quote");
    }
  }, [compareSnapshots.length, sidebarPanel]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Mobile / tablet: stacked cards (unchanged UX) */}
          <div className="flex flex-col gap-4 w-full lg:hidden">
            <LifeCompareQueueSection
              showOuterCard
              quotedRequestKey={quotedRequestKey}
              compareSnapshots={compareSnapshots}
              onOpenModal={() => setCompareModalOpen(true)}
              onRemove={removeCompareSnapshot}
              onClearAll={clearAllCompareSnapshots}
            />
            <LifeQuoteFormSection
              showOuterCard
              onSubmit={handleSubmit}
              isLoading={isLoading}
              enabledStates={enabledStates}
              enabledCarriers={enabledCarriers}
              quotedRequestKey={quotedRequestKey}
            />
          </div>

          {/* Desktop: collapsible sidebar (icon rail + panel) */}
          <aside
            className={`hidden lg:flex flex-col shrink-0 sticky top-20 self-start max-h-[calc(100vh-5rem)] transition-[width] duration-300 ease-in-out ${
              sidebarExpanded ? "w-[min(24rem,calc(100vw-2rem))]" : "w-14"
            }`}
            aria-label="Quote and compare tools"
          >
            <div className="flex rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden w-full min-h-[min(28rem,calc(100vh-6rem))] max-h-[calc(100vh-5rem)]">
              <nav
                className="w-14 shrink-0 flex flex-col items-center gap-1.5 py-3 px-1 border-r border-gray-100 bg-white"
                aria-hidden={false}
              >
                <button
                  type="button"
                  onClick={() => setSidebarExpanded((e) => !e)}
                  aria-expanded={sidebarExpanded}
                  aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
                  title={sidebarExpanded ? "Collapse" : "Expand"}
                  className="mb-1 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  {sidebarExpanded ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSidebarExpanded(true);
                    setSidebarPanel("quote");
                  }}
                  aria-label="Quote settings"
                  title="Quote settings"
                  className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                    sidebarPanel === "quote"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    className="h-5 w-5"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </button>

                {quotedRequestKey !== null && compareSnapshots.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSidebarExpanded(true);
                      setSidebarPanel("compare");
                    }}
                    aria-label={`Compare quotes, ${compareSnapshots.length} selected`}
                    title="Compare quotes"
                    className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                      sidebarPanel === "compare"
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.75}
                      className="h-5 w-5"
                      aria-hidden
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
                      />
                    </svg>
                    {compareSnapshots.length > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-emerald-600 px-0.5 text-[10px] font-bold text-white">
                        {compareSnapshots.length}
                      </span>
                    )}
                  </button>
                )}
              </nav>

              {sidebarExpanded && (
                <div className="flex-1 min-w-0 overflow-y-auto overscroll-contain px-3.5 py-3 border-l border-gray-100/80">
                  {sidebarPanel === "compare" && quotedRequestKey !== null ? (
                    <LifeCompareQueueSection
                      showOuterCard={false}
                      quotedRequestKey={quotedRequestKey}
                      compareSnapshots={compareSnapshots}
                      onOpenModal={() => setCompareModalOpen(true)}
                      onRemove={removeCompareSnapshot}
                      onClearAll={clearAllCompareSnapshots}
                    />
                  ) : (
                    <LifeQuoteFormSection
                      showOuterCard={false}
                      onSubmit={handleSubmit}
                      isLoading={isLoading}
                      enabledStates={enabledStates}
                      enabledCarriers={enabledCarriers}
                      quotedRequestKey={quotedRequestKey}
                    />
                  )}
                </div>
              )}
            </div>
          </aside>

          {/* Main: Results */}
          <div className="w-full lg:flex-1 lg:min-w-0 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {lastQuoteRequest && !isLoading && (
              <p
                className="text-sm text-gray-600 font-bold leading-snug break-words"
                title={formatLifeQuoteRunSummary(lastQuoteRequest)}
              >
                Current Quote: {formatLifeQuoteRunSummary(lastQuoteRequest)}
              </p>
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
                  {sortedResults.map((result) => {
                    const snapId = lastQuoteRequest
                      ? compareSnapshotId(result, lastQuoteRequest)
                      : "";
                    const rowKey = snapId || lifeQuoteRowId(result);
                    return (
                      <LifeQuoteCard
                        key={rowKey}
                        result={result}
                        isSelected={
                          !!snapId &&
                          compareSnapshots.some((s) => s.id === snapId)
                        }
                        onToggleCompare={() => toggleCompareFromCard(result)}
                        compareCheckDisabled={
                          compareSnapshots.length >= MAX_COMPARE_QUOTES &&
                          (!snapId ||
                            !compareSnapshots.some((s) => s.id === snapId))
                        }
                        formatDollar={formatDollar}
                        logoUrl={getLogoUrl(result.compProdCode)}
                        showIssueType={isFinalExpense}
                      />
                    );
                  })}
                </div>
              </>
            )}

            {!isLoading &&
              !error &&
              comparisons.length > 0 &&
              allResults.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <p className="text-sm text-gray-600">
                    No quotes included a usable premium. Try different
                    coverage, health class, or product type.
                  </p>
                </div>
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

        <LifeCompareModal
          open={compareModalOpen && compareSnapshots.length >= 2}
          onClose={() => setCompareModalOpen(false)}
          columns={compareModalColumns}
          formatDollar={formatDollar}
        />
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
  compareCheckDisabled,
  formatDollar,
  logoUrl,
  showIssueType = false,
}: {
  result: LifeQuoteResult;
  isSelected: boolean;
  onToggleCompare: () => void;
  compareCheckDisabled?: boolean;
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
      <div className="flex items-center gap-4">
        {/* Logo — left column, image centered in its box */}
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

        {/* Pricing + Compare — standard: monthly + annual; single/N-pay: modal amount only */}
        <div className="ml-4 flex-shrink-0 flex flex-col items-end text-right">
          {(() => {
            const lp = parseLimitedPayPlan(
              result.categoryTitle,
              result.product
            );
            if (lp?.kind === "single") {
              return (
                <>
                  <p className="text-sm text-gray-600">Single payment of</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {formatDollar(result.premiumAnnual)}
                  </p>
                </>
              );
            }
            if (lp?.kind === "installment") {
              return (
                <>
                  <p className="text-sm text-gray-600">
                    {lp.count} payments of
                  </p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {formatDollar(result.premiumAnnual)}
                  </p>
                </>
              );
            }
            if (result.premiumMonthly) {
              return (
                <>
                  <p className="text-2xl font-bold text-emerald-700">
                    {formatDollar(result.premiumMonthly)}
                  </p>
                  <p className="text-xs text-gray-500">per month</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDollar(result.premiumAnnual)}/yr
                  </p>
                </>
              );
            }
            return (
              <>
                <p className="text-2xl font-bold text-emerald-700">
                  {formatDollar(result.premiumAnnual)}
                </p>
                <p className="text-xs text-gray-500">per year</p>
              </>
            );
          })()}
          <button
            type="button"
            aria-pressed={isSelected}
            disabled={compareCheckDisabled && !isSelected}
            onClick={onToggleCompare}
            title={
              compareCheckDisabled && !isSelected
                ? `Maximum ${MAX_COMPARE_QUOTES} quotes in compare`
                : isSelected
                  ? "Remove from compare"
                  : "Add to compare"
            }
            className={`mt-2 min-w-[6rem] px-2.5 py-1.5 rounded-md text-xs font-semibold border-2 shadow-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${
              isSelected
                ? "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 hover:border-emerald-700 focus-visible:ring-emerald-500"
                : "border-emerald-600 bg-white text-emerald-700 hover:bg-emerald-50 hover:border-emerald-700 focus-visible:ring-emerald-500 disabled:border-gray-300 disabled:bg-gray-50 disabled:text-gray-400 disabled:hover:bg-gray-50"
            }`}
          >
            {isSelected ? "Comparing" : "Compare"}
          </button>
        </div>
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
