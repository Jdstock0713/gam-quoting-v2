"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  PDPPlan,
  County,
  PDPPlanDetail,
  SelectedPharmacy,
  MAIL_ORDER_PHARMACY_NPI,
} from "@/types";
import { fetchPDPPlans, fetchPDPPlanDetail } from "@/providers/quoteProvider";
import DrugSearch, { SelectedDrug } from "./DrugSearch";
import PharmacyPicker from "./PharmacyPicker";
import StepTracker from "./StepTracker";
import PDPCompareModal from "./PDPCompareModal";

const MAX_PDP_COMPARE = 3;

type Props = {
  zip: string;
  county: County;
  onBack: () => void;
};

type WizardStep = 0 | 1 | 2; // prescriptions, pharmacies, results

const STEPS = [
  { label: "Prescriptions" },
  { label: "Pharmacies" },
  { label: "Results" },
];

/** Matches DrugSearch frequency values for summary display */
const DRUG_FREQUENCY_LABEL: Record<string, string> = {
  FREQUENCY_30_DAYS: "Every month (30 days)",
  FREQUENCY_60_DAYS: "Every 2 months (60 days)",
  FREQUENCY_90_DAYS: "Every 3 months (90 days)",
  FREQUENCY_180_DAYS: "Every 6 months",
  FREQUENCY_360_DAYS: "Every 12 months",
};

function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}

/* ── Sidebar: search criteria (Part D wizard) ── */
function PDPSearchCriteriaPanel({
  compact,
  zip,
  county,
  drugs,
  selectedPharmacies,
}: {
  compact: boolean;
  zip: string;
  county: County;
  drugs: SelectedDrug[];
  selectedPharmacies: SelectedPharmacy[];
}) {
  const gap = compact ? "space-y-2.5" : "space-y-3";
  const h2 = compact ? "text-sm" : "text-base";
  const sec = compact ? "text-[10px]" : "text-xs";
  const body = compact ? "text-[11px]" : "text-xs";
  const item = compact ? "text-[11px] p-1.5" : "text-xs p-2";

  return (
    <div className={gap}>
      <div>
        <h2 className={`${h2} font-bold text-gray-800`}>Your search</h2>
        <p className={`${sec} text-gray-500 mt-0.5 leading-snug`}>
          Drugs and pharmacies used for this Part D quote.
        </p>
      </div>

      <div className={`rounded-lg border border-gray-100 bg-slate-50/80 px-2.5 py-2 ${body}`}>
        <p className="font-semibold text-gray-700">{county.name} County, {county.state}</p>
        <p className="text-gray-600">ZIP {zip}</p>
      </div>

      <section className="border-t border-gray-100 pt-2.5">
        <p className={`${sec} font-semibold text-gray-500 uppercase tracking-wide`}>
          Step 1 · {STEPS[0].label}
        </p>
        <div className="mt-1.5">
          {drugs.length === 0 ? (
            <p className={`${body} text-gray-500 italic`}>None added — drug cost estimates are not personalized.</p>
          ) : (
            <ul className={`space-y-1.5 ${body}`}>
              {drugs.map((d) => (
                <li
                  key={`${d.rxcui}-${d.ndc ?? ""}`}
                  className={`rounded-md bg-gray-50 border border-gray-100 ${item}`}
                >
                  <p className="font-semibold text-gray-800 leading-tight">{d.name}</p>
                  <p className="text-gray-600 mt-0.5">
                    Qty {d.quantity} · {DRUG_FREQUENCY_LABEL[d.frequency] ?? d.frequency}
                    {d.is_generic ? " · Generic" : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="border-t border-gray-100 pt-2.5">
        <p className={`${sec} font-semibold text-gray-500 uppercase tracking-wide`}>
          Step 2 · {STEPS[1].label}
        </p>
        <div className="mt-1.5">
          {selectedPharmacies.length === 0 ? (
            <p className={`${body} text-gray-500 italic`}>
              None selected — pricing uses default pharmacies for your ZIP.
            </p>
          ) : (
            <ul className={`space-y-1.5 ${body}`}>
              {selectedPharmacies.map((p) => (
                <li key={p.npi} className={`rounded-md bg-gray-50 border border-gray-100 ${item}`}>
                  <p className="font-semibold text-gray-800 leading-tight">{p.name}</p>
                  {p.npi === MAIL_ORDER_PHARMACY_NPI ? (
                    <p className={`${body} text-gray-500 mt-0.5`}>Delivered to your door</p>
                  ) : (
                    <p className="text-gray-600 mt-0.5 leading-snug">
                      {p.street ? `${p.street}, ` : ""}
                      {p.city}, {p.state} {p.zipcode?.slice(0, 5)}
                      {p.distance_miles != null && ` · ${p.distance_miles.toFixed(1)} mi`}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

/* ── Sidebar: filters + sort ── */
function PDPFilterPanel({
  compact,
  plans,
  filteredCount,
  filterCarriers,
  setFilterCarriers,
  filterStars,
  setFilterStars,
  carrierOptions,
  setCurrentPage,
  sortBy,
  setSortBy,
  drugsCount,
}: {
  compact: boolean;
  plans: PDPPlan[];
  filteredCount: number;
  filterCarriers: string[];
  setFilterCarriers: Dispatch<SetStateAction<string[]>>;
  filterStars: (number | "nr")[];
  setFilterStars: Dispatch<SetStateAction<(number | "nr")[]>>;
  carrierOptions: string[];
  setCurrentPage: Dispatch<SetStateAction<number>>;
  sortBy: "premium" | "deductible" | "stars" | "drugcost";
  setSortBy: Dispatch<SetStateAction<"premium" | "deductible" | "stars" | "drugcost">>;
  drugsCount: number;
}) {
  const gap = compact ? "space-y-2" : "space-y-3";
  const lbl = compact ? "text-[10px]" : "text-xs";
  const chk = compact ? "text-[11px]" : "text-xs";

  return (
    <div className={gap}>
      <h2 className={`${compact ? "text-sm" : "text-base"} font-bold text-gray-800`}>Filters</h2>

      <div>
        <p className={`${lbl} text-gray-500 font-medium mb-1`}>Sort by</p>
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as "premium" | "deductible" | "stars" | "drugcost");
            setCurrentPage(0);
          }}
          className={`w-full border border-gray-300 rounded px-2 py-1.5 ${chk}`}
        >
          <option value="premium">Monthly Premium</option>
          <option value="deductible">Deductible</option>
          <option value="stars">Star Rating</option>
          {drugsCount > 0 && <option value="drugcost">Est. Total Cost</option>}
        </select>
      </div>

      <div>
        <p className={`${lbl} text-gray-500 font-medium mb-1`}>Insurance carriers</p>
        <div className={`flex flex-wrap gap-x-2 gap-y-1 ${compact ? "max-h-20" : "max-h-28"} overflow-y-auto`}>
          {carrierOptions.map((name) => (
            <label key={name} className={`inline-flex items-center gap-1 ${chk}`}>
              <input
                type="checkbox"
                checked={filterCarriers.includes(name)}
                onChange={() => {
                  setFilterCarriers((prev) =>
                    prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
                  );
                  setCurrentPage(0);
                }}
                className="rounded border-gray-300"
              />
              <span className="text-gray-700 max-w-[9rem] truncate" title={name}>
                {name}
              </span>
            </label>
          ))}
        </div>
        {filterCarriers.length > 0 && (
          <button
            type="button"
            className={`${lbl} text-blue-600 mt-1 hover:underline`}
            onClick={() => setFilterCarriers([])}
          >
            Clear
          </button>
        )}
      </div>

      <div>
        <p className={`${lbl} text-gray-500 font-medium mb-1`}>Star ratings</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {([5, 4, 3, 2, 1, "nr"] as const).map((s) => (
            <label key={String(s)} className={`inline-flex items-center gap-1 ${chk}`}>
              <input
                type="checkbox"
                checked={filterStars.includes(s)}
                onChange={() => {
                  setFilterStars((prev) =>
                    prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                  );
                  setCurrentPage(0);
                }}
                className="rounded border-gray-300"
              />
              {s === "nr" ? "N/R" : `${s}★`}
            </label>
          ))}
        </div>
        {filterStars.length > 0 && (
          <button
            type="button"
            className={`${lbl} text-blue-600 mt-1 hover:underline`}
            onClick={() => setFilterStars([])}
          >
            Clear
          </button>
        )}
      </div>

      {filteredCount < plans.length && (
        <p className={`${lbl} text-gray-500`}>
          Showing {filteredCount} of {plans.length} plans
        </p>
      )}
    </div>
  );
}

/* ── Sidebar: compare ── */
function PDPComparePanel({
  compact,
  compared,
  maxCompare,
  onOpenFull,
  onClear,
  compareLoading,
  compareError,
  drugsCount,
}: {
  compact: boolean;
  compared: PDPPlan[];
  maxCompare: number;
  onOpenFull: () => void;
  onClear: () => void;
  compareLoading: boolean;
  compareError: string | null;
  drugsCount: number;
}) {
  const lbl = compact ? "text-[10px]" : "text-xs";
  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <p className={`${lbl} font-semibold text-gray-500 uppercase tracking-wide`}>
        Compare ({compared.length}/{maxCompare})
      </p>
      <button
        type="button"
        disabled={compared.length < 2 || compareLoading}
        onClick={onOpenFull}
        className={`w-full rounded-lg font-semibold transition-all ${
          compact ? "py-2 px-2 text-xs" : "py-2.5 px-4 text-sm"
        } ${
          compared.length >= 2
            ? compact
              ? "bg-blue-700 text-white shadow-sm ring-1 ring-amber-300/90 ring-offset-1 hover:bg-blue-800"
              : "bg-blue-700 text-white shadow-md ring-2 ring-amber-300 ring-offset-2 hover:bg-blue-800"
            : "bg-gray-100 text-gray-400 cursor-not-allowed"
        }`}
      >
        {compareLoading ? "Loading…" : "Full Comparison"}
      </button>
      {compareError && <p className={`${lbl} text-red-600`}>{compareError}</p>}
      <p className={`${lbl} text-gray-500 leading-snug`}>
        Select up to {maxCompare} plans with their checkboxes, then use Full Comparison for Medicare.gov-style detail.
      </p>

      {compared.length > 0 && (
        <>
          <ul className={`${compact ? "mt-1 space-y-1.5" : "mt-2 space-y-2"} border-t border-gray-100 pt-2`}>
            {compared.map((p) => (
              <li
                key={p.id}
                className={`${compact ? "text-[10px] p-1.5" : "text-xs p-2"} rounded-md bg-gray-50 border border-gray-100`}
              >
                <p className="font-semibold text-gray-800 truncate leading-tight">{p.name}</p>
                <p className="text-gray-600 truncate leading-tight">{p.organization_name}</p>
                <p className="text-blue-600 font-semibold mt-0.5">{formatCurrency(p.partd_premium)}/mo</p>
                {drugsCount > 0 && p.remaining_premium_and_drugs > 0 && (
                  <p className="text-orange-600 text-[10px]">
                    Est. total: {formatCurrency(p.remaining_premium_and_drugs)}/yr
                  </p>
                )}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onClear}
            className={`${lbl} text-red-600 hover:text-red-800 font-medium`}
          >
            Clear all
          </button>
        </>
      )}
    </div>
  );
}

export default function PDPResults({ zip, county, onBack }: Props) {
  const [wizardStep, setWizardStep] = useState<WizardStep>(0);
  const [drugs, setDrugs] = useState<SelectedDrug[]>([]);
  const [selectedPharmacies, setSelectedPharmacies] = useState<SelectedPharmacy[]>([]);

  // Results state
  const [plans, setPlans] = useState<PDPPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [pdpCompareOpen, setPdpCompareOpen] = useState(false);
  const [pdpCompareLoading, setPdpCompareLoading] = useState(false);
  const [pdpCompareDetails, setPdpCompareDetails] = useState<PDPPlanDetail[]>([]);
  const [pdpComparePlans, setPdpComparePlans] = useState<PDPPlan[]>([]);
  const [pdpCompareError, setPdpCompareError] = useState<string | null>(null);
  const [filterCarriers, setFilterCarriers] = useState<string[]>([]);
  const [filterStars, setFilterStars] = useState<(number | "nr")[]>([]);
  const [sortBy, setSortBy] = useState<"premium" | "deductible" | "stars" | "drugcost">(
    "premium"
  );
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarPanel, setSidebarPanel] = useState<"filters" | "compare" | "summary">("filters");
  const didAutoCollapseRef = useRef(false);

  async function handleFindPlans() {
    setIsLoading(true);
    setError(null);
    setWizardStep(2);

    try {
      const prescriptions = drugs.map((d) => ({
        rxcui: d.rxcui,
        ndc: d.ndc,
        quantity: d.quantity,
        frequency: d.frequency,
      }));

      const results = await fetchPDPPlans(
        zip,
        county.fips,
        "2026",
        0,
        selectedPharmacies.map((p) => p.npi),
        prescriptions
      );

      setPlans(results);
      setCurrentPage(0);
      if (results.length === 0) {
        setError("No Part D plans found for this area.");
      }
      if (!didAutoCollapseRef.current && results.length > 0) {
        didAutoCollapseRef.current = true;
        setSidebarExpanded(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch plans.");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_PDP_COMPARE) return prev;
      const next = [...prev, id];
      if (next.length >= 2) {
        setSidebarExpanded(true);
        setSidebarPanel("compare");
      }
      return next;
    });
  }

  async function openFullPdpComparison() {
    const ordered = selectedIds
      .map((id) => plans.find((p) => p.id === id))
      .filter((p): p is PDPPlan => !!p);
    if (ordered.length < 2) return;

    setPdpCompareError(null);
    setPdpCompareLoading(true);
    const year = ordered[0]?.contract_year ?? "2026";
    try {
      const details = await Promise.all(
        ordered.map((p) =>
          fetchPDPPlanDetail(year, p.contract_id, p.plan_id, p.segment_id)
        )
      );
      setPdpComparePlans(ordered);
      setPdpCompareDetails(details);
      setPdpCompareOpen(true);
    } catch (e) {
      console.error("[PDPResults] Plan detail fetch:", e);
      setPdpCompareError(
        e instanceof Error ? e.message : "Failed to load plan details."
      );
      setPdpComparePlans([]);
      setPdpCompareDetails([]);
    } finally {
      setPdpCompareLoading(false);
    }
  }

  function closePdpCompare() {
    setPdpCompareOpen(false);
    setPdpCompareDetails([]);
    setPdpComparePlans([]);
    setPdpCompareError(null);
  }

  function starBucket(rating: number | undefined): number | "nr" {
    const r = rating ?? 0;
    if (r <= 0) return "nr";
    return Math.round(r);
  }

  const carrierOptions = useMemo(() => {
    const s = new Set<string>();
    for (const p of plans) s.add(p.organization_name);
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [plans]);

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (filterCarriers.length > 0 && !filterCarriers.includes(p.organization_name)) {
        return false;
      }
      if (filterStars.length > 0) {
        const b = starBucket(p.overall_star_rating?.rating);
        if (!filterStars.includes(b)) return false;
      }
      return true;
    });
  }, [plans, filterCarriers, filterStars]);

  const sorted = [...filteredPlans].sort((a, b) => {
    if (sortBy === "deductible")
      return a.drug_plan_deductible - b.drug_plan_deductible;
    if (sortBy === "stars")
      return (
        (b.overall_star_rating?.rating ?? 0) -
        (a.overall_star_rating?.rating ?? 0)
      );
    if (sortBy === "drugcost")
      return a.remaining_premium_and_drugs - b.remaining_premium_and_drugs;
    return a.partd_premium - b.partd_premium;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginatedPlans = sorted.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const compared = selectedIds
    .map((id) => plans.find((p) => p.id === id))
    .filter((p): p is PDPPlan => !!p);

  useEffect(() => {
    if (compared.length < 2 && sidebarPanel === "compare") {
      setSidebarPanel("filters");
    }
  }, [compared.length, sidebarPanel]);

  const showSidebar = wizardStep === 2 && !isLoading && plans.length > 0;

  const filterProps = {
    compact: true as const,
    plans,
    filteredCount: filteredPlans.length,
    filterCarriers,
    setFilterCarriers,
    filterStars,
    setFilterStars,
    carrierOptions,
    setCurrentPage,
    sortBy,
    setSortBy,
    drugsCount: drugs.length,
  };

  const compareProps = {
    compact: true as const,
    compared,
    maxCompare: MAX_PDP_COMPARE,
    onOpenFull: openFullPdpComparison,
    onClear: () => setSelectedIds([]),
    compareLoading: pdpCompareLoading,
    compareError: pdpCompareError,
    drugsCount: drugs.length,
  };

  const searchCriteriaProps = {
    compact: true as const,
    zip,
    county,
    drugs,
    selectedPharmacies,
  };

  const summaryParts: string[] = [];
  if (drugs.length > 0) summaryParts.push(`${drugs.length} drug(s)`);
  if (selectedPharmacies.length > 0) summaryParts.push(`${selectedPharmacies.length} pharmacy(s)`);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button
            onClick={wizardStep === 0 ? onBack : () => setWizardStep((wizardStep - 1) as WizardStep)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium mb-1"
          >
            &larr; {wizardStep === 0 ? "Back to plan selection" : "Back"}
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">
            Part D Prescription Drug Plans
          </h1>
          <p className="text-xs text-gray-500">
            {county.name} County, {county.state} ({zip})
            {summaryParts.length > 0 && ` · ${summaryParts.join(" · ")}`}
          </p>
        </div>
      </header>

      {/* Progress tracker */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <StepTracker steps={STEPS} currentStep={wizardStep} onStepClick={(s) => setWizardStep(s as WizardStep)} />
        </div>
      </div>

      {/* Step content */}
      <main
        className={
          wizardStep === 2 ? "max-w-7xl mx-auto px-4 py-6" : "max-w-4xl mx-auto px-4 py-6"
        }
      >
        {/* ── Step 0: Prescriptions ── */}
        {wizardStep === 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                Add Your Prescriptions
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Add the drugs you take to compare annual drug costs across Part D
                plans. You can skip this to see all available plans.
              </p>
              <DrugSearch drugs={drugs} onDrugsChange={setDrugs} />
            </div>

            <div className="flex justify-between">
              <button
                onClick={onBack}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setWizardStep(1)}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {drugs.length > 0
                  ? `Next: Pharmacies (${drugs.length} drug${drugs.length !== 1 ? "s" : ""} added)`
                  : "Skip & Continue"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Pharmacies ── */}
        {wizardStep === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                Select Your Pharmacies
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Choose your pharmacies for accurate in-network pricing.
                You can skip this step too.
              </p>
              <PharmacyPicker
                zip={zip}
                selectedPharmacies={selectedPharmacies}
                onSelectionChange={setSelectedPharmacies}
              />
            </div>

            {/* Summary before search */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 mb-1">
                Ready to search
              </p>
              <p className="text-xs text-blue-600">
                {drugs.length} drug(s) &middot; {selectedPharmacies.length} pharmacy(s) selected
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setWizardStep(0)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleFindPlans}
                className="px-8 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
              >
                Find Plans
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Results (sidebar matches Medicare Advantage / Part C layout) ── */}
        {wizardStep === 2 && (
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {showSidebar && (
              <div className="flex flex-col gap-4 w-full md:hidden">
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <PDPSearchCriteriaPanel {...searchCriteriaProps} compact={false} />
                </div>
                {compared.length >= 2 && (
                  <div className="bg-white rounded-lg shadow-lg p-4">
                    <PDPComparePanel {...compareProps} compact={false} />
                  </div>
                )}
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <PDPFilterPanel {...filterProps} compact={false} />
                </div>
              </div>
            )}

            {showSidebar && (
              <aside
                className={`hidden md:flex flex-col shrink-0 sticky top-20 self-start max-h-[calc(100vh-5rem)] transition-[width] duration-300 ease-in-out ${
                  sidebarExpanded ? "w-[min(22rem,calc(100vw-2rem))]" : "w-14"
                }`}
                aria-label="Search summary, filters, and compare tools"
              >
                <div className="flex rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden w-full min-h-[min(28rem,calc(100vh-6rem))] max-h-[calc(100vh-5rem)]">
                  <nav className="w-14 shrink-0 flex flex-col items-center gap-1.5 py-3 px-1 border-r border-gray-100 bg-white">
                    <button
                      type="button"
                      onClick={() => setSidebarExpanded((e) => !e)}
                      aria-expanded={sidebarExpanded}
                      aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
                      title={sidebarExpanded ? "Collapse" : "Expand"}
                      className="mb-1 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      {sidebarExpanded ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                          <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden>
                          <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setSidebarExpanded(true); setSidebarPanel("summary"); }}
                      aria-label="Your prescriptions and pharmacies for this quote"
                      title="Your search"
                      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                        sidebarPanel === "summary" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setSidebarExpanded(true); setSidebarPanel("filters"); }}
                      aria-label="Filters"
                      title="Filters"
                      className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                        sidebarPanel === "filters" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
                      </svg>
                    </button>

                    {compared.length >= 2 && (
                      <button
                        type="button"
                        onClick={() => { setSidebarExpanded(true); setSidebarPanel("compare"); }}
                        aria-label={`Compare plans, ${compared.length} selected`}
                        title="Compare plans"
                        className={`relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                          sidebarPanel === "compare" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-100"
                        }`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
                          {compared.length}
                        </span>
                      </button>
                    )}
                  </nav>

                  {sidebarExpanded && (
                    <div className="flex-1 min-w-0 overflow-y-auto overscroll-contain px-3.5 py-3 border-l border-gray-100/80">
                      {sidebarPanel === "compare" && compared.length >= 2 ? (
                        <PDPComparePanel {...compareProps} />
                      ) : sidebarPanel === "summary" ? (
                        <PDPSearchCriteriaPanel {...searchCriteriaProps} />
                      ) : (
                        <PDPFilterPanel {...filterProps} />
                      )}
                    </div>
                  )}
                </div>
              </aside>
            )}

            <div className="flex-1 min-w-0" role="region" aria-label="Part D plan results">
              {!isLoading && plans.length > 0 && (
                <div className="mb-4">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    &larr; Modify search criteria
                  </button>
                </div>
              )}

              {isLoading && (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="mt-3 text-gray-500">
                  Fetching Part D plans from Medicare.gov...
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
                {error}
              </div>
            )}

            {!isLoading && plans.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Plans ({filteredPlans.length}
                  {filteredPlans.length !== plans.length ? ` of ${plans.length}` : ""})
                  {sorted.length > 0 && totalPages > 1 && (
                    <span className="text-sm font-normal text-gray-500 ml-2">
                      — Page {currentPage + 1} of {totalPages}
                    </span>
                  )}
                </h2>
                {sorted.length === 0 ? (
                  <p className="text-sm text-gray-600 py-6">
                    No plans match the selected filters. Adjust filters to see results.
                  </p>
                ) : (
                <Fragment>
                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                    <button onClick={() => setCurrentPage(0)} disabled={currentPage === 0} className="px-3 py-2 sm:py-1.5 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0 hidden sm:inline-flex">First</button>
                    <button onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0} className="px-3 py-2 sm:py-1.5 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0">&larr; Prev</button>
                    <span className="px-4 py-1.5 text-sm font-semibold text-blue-600">{currentPage + 1} / {totalPages}</span>
                    <button onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} className="px-3 py-2 sm:py-1.5 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0">Next &rarr;</button>
                    <button onClick={() => setCurrentPage(totalPages - 1)} disabled={currentPage >= totalPages - 1} className="px-3 py-2 sm:py-1.5 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0 hidden sm:inline-flex">Last</button>
                  </div>
                )}
                <div className="grid gap-3">
                  {paginatedPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`bg-white rounded-lg shadow p-4 border-2 transition-colors ${
                        selectedIds.includes(plan.id)
                          ? "border-blue-500"
                          : "border-transparent"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-800">
                              {plan.name}
                            </h3>
                            {plan.overall_star_rating?.rating > 0 && (
                              <span className="text-xs text-yellow-600 font-semibold">
                                {"★".repeat(
                                  Math.floor(plan.overall_star_rating.rating)
                                )}
                                {plan.overall_star_rating.rating % 1 >= 0.5
                                  ? "½"
                                  : ""}{" "}
                                {plan.overall_star_rating.rating}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {plan.organization_name}
                          </p>
                          <p className="text-xs font-mono text-gray-700 mt-0.5 font-medium">
                            Plan ID: {plan.contract_id}-{plan.plan_id}-{plan.segment_id}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Includes: Only drug coverage
                          </p>

                          <div className="flex items-baseline gap-4 mt-2 flex-wrap">
                            <div>
                              <span className="text-2xl font-bold text-blue-600">
                                {formatCurrency(plan.partd_premium)}
                              </span>
                              <span className="text-sm text-gray-500">/mo</span>
                            </div>
                            <span className="text-xs text-gray-500">
                              Deductible:{" "}
                              {formatCurrency(plan.drug_plan_deductible)}
                            </span>
                            {drugs.length > 0 &&
                              plan.remaining_premium_and_drugs > 0 && (
                                <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded font-semibold">
                                  Est. total:{" "}
                                  {formatCurrency(
                                    plan.remaining_premium_and_drugs
                                  )}
                                  /yr
                                </span>
                              )}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(plan.id)}
                          disabled={
                            !selectedIds.includes(plan.id) &&
                            selectedIds.length >= MAX_PDP_COMPARE
                          }
                          onChange={() => toggleSelect(plan.id)}
                          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1 disabled:opacity-40"
                          title={
                            selectedIds.length >= MAX_PDP_COMPARE &&
                            !selectedIds.includes(plan.id)
                              ? `Select up to ${MAX_PDP_COMPARE} plans`
                              : "Select for comparison"
                          }
                        />
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2 items-center">
                        {plan.url && (
                          <>
                            <a
                              href={
                                plan.url.startsWith("http")
                                  ? plan.url
                                  : `https://${plan.url}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg"
                            >
                              Plan details
                            </a>
                            <a
                              href={
                                plan.url.startsWith("http")
                                  ? plan.url
                                  : `https://${plan.url}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                              Enroll
                            </a>
                          </>
                        )}
                      </div>
                      {selectedPharmacies.length === 0 && (
                        <p className="text-xs text-gray-500 mt-2">
                          Pharmacies: add your drugs &amp; pharmacies in the wizard for network-specific
                          estimates.
                        </p>
                      )}
                      {drugs.length === 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Drugs: add your prescription drugs to compare estimated costs.
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination controls */}
                {sorted.length > 0 && totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setCurrentPage(0)}
                      disabled={currentPage === 0}
                      className="hidden sm:inline-flex px-3 py-2 sm:py-1.5 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      className="px-3 py-2 sm:py-1.5 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
                    >
                      &larr; Prev
                    </button>
                    <span className="px-4 py-1.5 text-sm font-semibold text-blue-600">
                      {currentPage + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage >= totalPages - 1}
                      className="px-3 py-2 sm:py-1.5 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
                    >
                      Next &rarr;
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages - 1)}
                      disabled={currentPage >= totalPages - 1}
                      className="hidden sm:inline-flex px-3 py-2 sm:py-1.5 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0"
                    >
                      Last
                    </button>
                  </div>
                )}
                </Fragment>
                )}
              </div>
            )}
            </div>
          </div>
        )}
      </main>
      <PDPCompareModal
        open={pdpCompareOpen}
        onClose={closePdpCompare}
        plans={pdpComparePlans}
        planDetails={pdpCompareDetails}
        zip={zip}
        drugCount={drugs.length}
        drugNames={drugs.map((d) => d.name)}
        onRemovePlan={(planId) => {
          const idx = pdpComparePlans.findIndex(
            (p) => `${p.contract_id}-${p.plan_id}-${p.segment_id}` === planId
          );
          if (idx < 0) return;
          const nextPlans = pdpComparePlans.filter((_, i) => i !== idx);
          const nextDetails = pdpCompareDetails.filter((_, i) => i !== idx);
          if (nextPlans.length < 2) {
            closePdpCompare();
          } else {
            setPdpComparePlans(nextPlans);
            setPdpCompareDetails(nextDetails);
          }
          setSelectedIds((prev) => {
            const removedPlan = pdpComparePlans[idx];
            return removedPlan ? prev.filter((id) => id !== removedPlan.id) : prev;
          });
        }}
      />
    </div>
  );
}
