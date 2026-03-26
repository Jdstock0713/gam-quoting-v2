"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { MAPlan, County, MAPlanDetail, SelectedPharmacy, MAIL_ORDER_PHARMACY_NPI } from "@/types";
import { fetchMAPlans, fetchPlanDetail } from "@/providers/quoteProvider";
import DrugSearch, { SelectedDrug } from "./DrugSearch";
import PharmacyPicker from "./PharmacyPicker";
import ProviderSearch, { SelectedProvider } from "./ProviderSearch";
import StepTracker from "./StepTracker";
import MACompareModal from "./MACompareModal";
import { labelAvailabilityCode, labelSnpType } from "@/lib/maPlanLabels";

const MAX_MA_COMPARE = 3;

type Props = {
  zip: string;
  county: County;
  onBack: () => void;
};

type WizardStep = 0 | 1 | 2 | 3;

const STEPS = [
  { label: "Prescriptions" },
  { label: "Doctors" },
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

function parseHealthDeductible(s: string): number {
  const n = parseFloat(String(s).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

function starBucket(rating: number | undefined): number | "nr" {
  const r = rating ?? 0;
  if (r <= 0) return "nr";
  return Math.round(r);
}

function categoryLabel(cat: string): string {
  const map: Record<string, string> = {
    PLAN_CATEGORY_LOCAL_PPO: "Local PPO",
    PLAN_CATEGORY_REGIONAL_PPO: "Regional PPO",
    PLAN_CATEGORY_HMO: "HMO",
    PLAN_CATEGORY_HMOPOS: "HMO-POS",
    PLAN_CATEGORY_LOCAL_PFFS: "Private FFS",
    PLAN_CATEGORY_MSA: "MSA",
    PLAN_CATEGORY_COST: "Cost",
  };
  return map[cat] ?? cat.replace("PLAN_CATEGORY_", "").replace(/_/g, " ");
}

/* ── Sidebar panel: Filters ── */
function FilterPanel({
  compact,
  plans,
  filteredCount,
  filterHmo, setFilterHmo,
  filterPpo, setFilterPpo,
  filterMapdOnly, setFilterMapdOnly,
  filterVision, setFilterVision,
  filterDental, setFilterDental,
  filterHearing, setFilterHearing,
  filterTransport, setFilterTransport,
  filterFitness, setFilterFitness,
  filterCarriers, setFilterCarriers,
  filterStars, setFilterStars,
  carrierOptions,
  setCurrentPage,
  sortBy, setSortBy,
  drugsCount,
}: {
  compact: boolean;
  plans: MAPlan[];
  filteredCount: number;
  filterHmo: boolean; setFilterHmo: React.Dispatch<React.SetStateAction<boolean>>;
  filterPpo: boolean; setFilterPpo: React.Dispatch<React.SetStateAction<boolean>>;
  filterMapdOnly: boolean; setFilterMapdOnly: React.Dispatch<React.SetStateAction<boolean>>;
  filterVision: boolean; setFilterVision: React.Dispatch<React.SetStateAction<boolean>>;
  filterDental: boolean; setFilterDental: React.Dispatch<React.SetStateAction<boolean>>;
  filterHearing: boolean; setFilterHearing: React.Dispatch<React.SetStateAction<boolean>>;
  filterTransport: boolean; setFilterTransport: React.Dispatch<React.SetStateAction<boolean>>;
  filterFitness: boolean; setFilterFitness: React.Dispatch<React.SetStateAction<boolean>>;
  filterCarriers: string[]; setFilterCarriers: React.Dispatch<React.SetStateAction<string[]>>;
  filterStars: (number | "nr")[]; setFilterStars: React.Dispatch<React.SetStateAction<(number | "nr")[]>>;
  carrierOptions: string[];
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  sortBy: string; setSortBy: React.Dispatch<React.SetStateAction<"premium" | "stars" | "drugcost" | "healthded">>;
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
            setSortBy(e.target.value as "premium" | "stars" | "drugcost" | "healthded");
            setCurrentPage(0);
          }}
          className={`w-full border border-gray-300 rounded px-2 py-1.5 ${chk}`}
        >
          <option value="premium">Monthly Premium</option>
          <option value="healthded">Lowest health deductible</option>
          <option value="stars">Star Rating</option>
          {drugsCount > 0 && <option value="drugcost">Est. Total Cost</option>}
        </select>
      </div>

      <div>
        <p className={`${lbl} text-gray-500 font-medium mb-1`}>Plan type</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {([
            ["HMO", filterHmo, setFilterHmo],
            ["PPO", filterPpo, setFilterPpo],
          ] as const).map(([label, checked, setFn]) => (
            <label key={label} className={`inline-flex items-center gap-1 ${chk}`}>
              <input type="checkbox" checked={checked} onChange={() => { setFn((v) => !v); setCurrentPage(0); }} className="rounded border-gray-300" />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className={`${lbl} text-gray-500 font-medium mb-1`}>Drug coverage</p>
        <label className={`inline-flex items-center gap-1 ${chk}`}>
          <input type="checkbox" checked={filterMapdOnly} onChange={() => { setFilterMapdOnly((v) => !v); setCurrentPage(0); }} className="rounded border-gray-300" />
          MAPD only
        </label>
      </div>

      <div>
        <p className={`${lbl} text-gray-500 font-medium mb-1`}>Benefits</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {([
            ["Vision", filterVision, setFilterVision],
            ["Dental", filterDental, setFilterDental],
            ["Hearing", filterHearing, setFilterHearing],
            ["Transport", filterTransport, setFilterTransport],
            ["Fitness", filterFitness, setFilterFitness],
          ] as const).map(([label, checked, setFn]) => (
            <label key={label} className={`inline-flex items-center gap-1 ${chk}`}>
              <input type="checkbox" checked={checked} onChange={() => { setFn((v) => !v); setCurrentPage(0); }} className="rounded border-gray-300" />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className={`${lbl} text-gray-500 font-medium mb-1`}>Star ratings</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {([5, 4, 3, 2, 1, "nr"] as const).map((s) => (
            <label key={String(s)} className={`inline-flex items-center gap-1 ${chk}`}>
              <input
                type="checkbox"
                checked={filterStars.includes(s)}
                onChange={() => { setFilterStars((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]); setCurrentPage(0); }}
                className="rounded border-gray-300"
              />
              {s === "nr" ? "N/R" : `${s}★`}
            </label>
          ))}
        </div>
        {filterStars.length > 0 && (
          <button type="button" className={`${lbl} text-blue-600 mt-1 hover:underline`} onClick={() => setFilterStars([])}>Clear</button>
        )}
      </div>

      <div>
        <p className={`${lbl} text-gray-500 font-medium mb-1`}>Carriers</p>
        <div className={`flex flex-wrap gap-x-2 gap-y-1 ${compact ? "max-h-20" : "max-h-28"} overflow-y-auto`}>
          {carrierOptions.map((name) => (
            <label key={name} className={`inline-flex items-center gap-1 ${chk}`}>
              <input
                type="checkbox"
                checked={filterCarriers.includes(name)}
                onChange={() => { setFilterCarriers((prev) => prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]); setCurrentPage(0); }}
                className="rounded border-gray-300"
              />
              <span className="text-gray-700 max-w-[9rem] truncate" title={name}>{name}</span>
            </label>
          ))}
        </div>
        {filterCarriers.length > 0 && (
          <button type="button" className={`${lbl} text-blue-600 mt-1 hover:underline`} onClick={() => setFilterCarriers([])}>Clear</button>
        )}
      </div>

      {filteredCount < plans.length && (
        <p className={`${lbl} text-gray-500`}>Showing {filteredCount} of {plans.length} plans</p>
      )}
    </div>
  );
}

/* ── Sidebar panel: Compare ── */
function ComparePanel({
  compact,
  compared,
  selectedIds,
  maxCompare,
  onOpenFull,
  onClear,
  compareLoading,
  compareError,
  drugsCount,
}: {
  compact: boolean;
  compared: MAPlan[];
  selectedIds: number[];
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
              <li key={p.id} className={`${compact ? "text-[10px] p-1.5" : "text-xs p-2"} rounded-md bg-gray-50 border border-gray-100`}>
                <p className="font-semibold text-gray-800 truncate leading-tight">{p.name}</p>
                <p className="text-gray-600 truncate leading-tight">{p.organization_name}</p>
                <p className="text-blue-600 font-semibold mt-0.5">
                  {formatCurrency(p.partc_premium + p.partd_premium)}/mo
                </p>
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

/* ── Sidebar panel: Search criteria (wizard steps 1–3) ── */
function SearchCriteriaPanel({
  compact,
  zip,
  county,
  drugs,
  providers,
  selectedPharmacies,
}: {
  compact: boolean;
  zip: string;
  county: County;
  drugs: SelectedDrug[];
  providers: SelectedProvider[];
  selectedPharmacies: SelectedPharmacy[];
}) {
  const gap = compact ? "space-y-2.5" : "space-y-3";
  const h2 = compact ? "text-sm" : "text-base";
  const sec = compact ? "text-[10px]" : "text-xs";
  const body = compact ? "text-[11px]" : "text-xs";
  const item = compact ? "text-[11px] p-1.5" : "text-xs p-2";

  const sections: { stepLabel: string; stepTitle: string; children: React.ReactNode }[] = [
    {
      stepLabel: "Step 1",
      stepTitle: STEPS[0].label,
      children:
        drugs.length === 0 ? (
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
        ),
    },
    {
      stepLabel: "Step 2",
      stepTitle: STEPS[1].label,
      children:
        providers.length === 0 ? (
          <p className={`${body} text-gray-500 italic`}>None added — provider network was not used to narrow plans.</p>
        ) : (
          <ul className={`space-y-1.5 ${body}`}>
            {providers.map((p) => (
              <li key={p.npi} className={`rounded-md bg-gray-50 border border-gray-100 ${item}`}>
                <p className="font-semibold text-gray-800 leading-tight">{p.name}</p>
                <p className="text-gray-600 truncate" title={p.specialty}>
                  {p.credential ? `${p.credential} · ` : ""}
                  {p.specialty || "Specialty not listed"}
                </p>
                <p className="text-gray-500 mt-0.5">
                  {p.city}, {p.state}
                </p>
              </li>
            ))}
          </ul>
        ),
    },
    {
      stepLabel: "Step 3",
      stepTitle: STEPS[2].label,
      children:
        selectedPharmacies.length === 0 ? (
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
        ),
    },
  ];

  return (
    <div className={gap}>
      <div>
        <h2 className={`${h2} font-bold text-gray-800`}>Your search</h2>
        <p className={`${sec} text-gray-500 mt-0.5 leading-snug`}>
          Criteria from the steps before results. Location is fixed for this quote.
        </p>
      </div>

      <div className={`rounded-lg border border-gray-100 bg-slate-50/80 px-2.5 py-2 ${body}`}>
        <p className="font-semibold text-gray-700">{county.name} County, {county.state}</p>
        <p className="text-gray-600">ZIP {zip}</p>
      </div>

      {sections.map(({ stepLabel, stepTitle, children }) => (
        <section key={stepTitle} className="border-t border-gray-100 pt-2.5 first:border-t-0 first:pt-0">
          <p className={`${sec} font-semibold text-gray-500 uppercase tracking-wide`}>
            {stepLabel} · {stepTitle}
          </p>
          <div className="mt-1.5">{children}</div>
        </section>
      ))}
    </div>
  );
}

export default function MAResults({ zip, county, onBack }: Props) {
  const [wizardStep, setWizardStep] = useState<WizardStep>(0);
  const [drugs, setDrugs] = useState<SelectedDrug[]>([]);
  const [selectedPharmacies, setSelectedPharmacies] = useState<SelectedPharmacy[]>([]);
  const [providers, setProviders] = useState<SelectedProvider[]>([]);

  const [plans, setPlans] = useState<MAPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [maCompareOpen, setMaCompareOpen] = useState(false);
  const [maCompareLoading, setMaCompareLoading] = useState(false);
  const [maCompareDetails, setMaCompareDetails] = useState<MAPlanDetail[]>([]);
  const [maComparePlans, setMaComparePlans] = useState<MAPlan[]>([]);
  const [maCompareError, setMaCompareError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"premium" | "stars" | "drugcost" | "healthded">("premium");
  const [filterCarriers, setFilterCarriers] = useState<string[]>([]);
  const [filterStars, setFilterStars] = useState<(number | "nr")[]>([]);
  const [filterHmo, setFilterHmo] = useState(false);
  const [filterPpo, setFilterPpo] = useState(false);
  const [filterVision, setFilterVision] = useState(false);
  const [filterDental, setFilterDental] = useState(false);
  const [filterHearing, setFilterHearing] = useState(false);
  const [filterTransport, setFilterTransport] = useState(false);
  const [filterFitness, setFilterFitness] = useState(false);
  const [filterMapdOnly, setFilterMapdOnly] = useState(false);
  const [moreBenefitsOpen, setMoreBenefitsOpen] = useState<Record<number, boolean>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const ITEMS_PER_PAGE = 10;

  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sidebarPanel, setSidebarPanel] = useState<"filters" | "compare" | "summary">("filters");
  const didAutoCollapseRef = useRef(false);

  async function handleFindPlans() {
    setIsLoading(true);
    setError(null);
    setWizardStep(3);

    try {
      const prescriptions = drugs.map((d) => ({
        rxcui: d.rxcui,
        ndc: d.ndc,
        quantity: d.quantity,
        frequency: d.frequency,
      }));

      const results = await fetchMAPlans(
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
        setError("No Medicare Advantage plans found for this area.");
      }
      if (!didAutoCollapseRef.current) {
        didAutoCollapseRef.current = true;
        setSidebarExpanded(false);
      }
    } catch (e) {
      console.error("[MAResults] Fetch error:", e);
      setError(e instanceof Error ? e.message : "Failed to fetch plans.");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_MA_COMPARE) return prev;
      const next = [...prev, id];
      if (next.length >= 2) {
        setSidebarExpanded(true);
        setSidebarPanel("compare");
      }
      return next;
    });
  }

  async function openFullComparison() {
    const ordered = selectedIds
      .map((id) => plans.find((p) => p.id === id))
      .filter((p): p is MAPlan => !!p);
    if (ordered.length < 2) return;

    setMaCompareError(null);
    setMaCompareLoading(true);
    const year = ordered[0]?.contract_year ?? "2026";
    try {
      const details = await Promise.all(
        ordered.map((p) => fetchPlanDetail(year, p.contract_id, p.plan_id, p.segment_id))
      );
      setMaComparePlans(ordered);
      setMaCompareDetails(details);
      setMaCompareOpen(true);
    } catch (e) {
      console.error("[MAResults] Plan detail fetch:", e);
      setMaCompareError(e instanceof Error ? e.message : "Failed to load plan details.");
      setMaComparePlans([]);
      setMaCompareDetails([]);
    } finally {
      setMaCompareLoading(false);
    }
  }

  function closeMaCompare() {
    setMaCompareOpen(false);
    setMaCompareDetails([]);
    setMaComparePlans([]);
    setMaCompareError(null);
  }

  const carrierOptions = useMemo(() => {
    const s = new Set<string>();
    for (const p of plans) s.add(p.organization_name);
    return Array.from(s).sort((a, b) => a.localeCompare(b));
  }, [plans]);

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      if (filterCarriers.length > 0 && !filterCarriers.includes(p.organization_name)) return false;
      if (filterStars.length > 0) {
        const b = starBucket(p.overall_star_rating?.rating);
        if (!filterStars.includes(b)) return false;
      }
      if (filterMapdOnly && p.plan_type !== "PLAN_TYPE_MAPD") return false;
      const wantPlanType = filterHmo || filterPpo;
      if (wantPlanType) {
        const isHmo = p.category.includes("HMO");
        const isPpo = p.category.includes("PPO");
        if (!(filterHmo && isHmo) && !(filterPpo && isPpo)) return false;
      }
      if (filterVision && !p.package_services?.ms_vision_services) return false;
      if (filterDental && !p.package_services?.ms_dental_services) return false;
      if (filterHearing && !p.package_services?.ms_hearing_services) return false;
      if (filterTransport && !p.transportation) return false;
      if (filterFitness && !p.silver_sneakers) return false;
      return true;
    });
  }, [plans, filterCarriers, filterStars, filterMapdOnly, filterHmo, filterPpo, filterVision, filterDental, filterHearing, filterTransport, filterFitness]);

  const sorted = [...filteredPlans].sort((a, b) => {
    if (sortBy === "stars") return (b.overall_star_rating?.rating ?? 0) - (a.overall_star_rating?.rating ?? 0);
    if (sortBy === "drugcost") return a.remaining_premium_and_drugs - b.remaining_premium_and_drugs;
    if (sortBy === "healthded") return parseHealthDeductible(a.annual_deductible) - parseHealthDeductible(b.annual_deductible);
    return (a.partc_premium + a.partd_premium) - (b.partc_premium + b.partd_premium);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginatedPlans = sorted.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  const compared = selectedIds.map((id) => plans.find((p) => p.id === id)).filter((p): p is MAPlan => !!p);

  useEffect(() => {
    if (compared.length < 2 && sidebarPanel === "compare") {
      setSidebarPanel("filters");
    }
  }, [compared.length, sidebarPanel]);

  const summaryParts: string[] = [];
  if (drugs.length > 0) summaryParts.push(`${drugs.length} drug(s)`);
  if (providers.length > 0) summaryParts.push(`${providers.length} provider(s)`);
  if (selectedPharmacies.length > 0) summaryParts.push(`${selectedPharmacies.length} pharmacy(s)`);

  const showSidebar = wizardStep === 3 && !isLoading && plans.length > 0;

  const filterProps = {
    compact: true,
    plans, filteredCount: filteredPlans.length,
    filterHmo, setFilterHmo, filterPpo, setFilterPpo,
    filterMapdOnly, setFilterMapdOnly,
    filterVision, setFilterVision, filterDental, setFilterDental,
    filterHearing, setFilterHearing, filterTransport, setFilterTransport,
    filterFitness, setFilterFitness,
    filterCarriers, setFilterCarriers, filterStars, setFilterStars,
    carrierOptions, setCurrentPage, sortBy, setSortBy,
    drugsCount: drugs.length,
  };

  const compareProps = {
    compact: true,
    compared, selectedIds, maxCompare: MAX_MA_COMPARE,
    onOpenFull: openFullComparison, onClear: () => setSelectedIds([]),
    compareLoading: maCompareLoading, compareError: maCompareError,
    drugsCount: drugs.length,
  };

  const searchCriteriaProps = {
    compact: true,
    zip,
    county,
    drugs,
    providers,
    selectedPharmacies,
  };

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
          <h1 className="text-lg sm:text-xl font-bold text-gray-800">Medicare Advantage Plans</h1>
          <p className="text-xs text-gray-500">
            {county.name} County, {county.state} ({zip})
            {summaryParts.length > 0 && ` · ${summaryParts.join(" · ")}`}
          </p>
        </div>
      </header>

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <StepTracker steps={STEPS} currentStep={wizardStep} onStepClick={(s) => setWizardStep(s as WizardStep)} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* Mobile / tablet: stacked filter + compare cards (only on results step) */}
          {showSidebar && (
            <div className="flex flex-col gap-4 w-full md:hidden">
              <div className="bg-white rounded-lg shadow-lg p-4">
                <SearchCriteriaPanel {...searchCriteriaProps} compact={false} />
              </div>
              {compared.length >= 2 && (
                <div className="bg-white rounded-lg shadow-lg p-4">
                  <ComparePanel {...compareProps} compact={false} />
                </div>
              )}
              <div className="bg-white rounded-lg shadow-lg p-4">
                <FilterPanel {...filterProps} compact={false} />
              </div>
            </div>
          )}

          {/* Desktop: collapsible sidebar */}
          {showSidebar && (
            <aside
              className={`hidden md:flex flex-col shrink-0 sticky top-20 self-start max-h-[calc(100vh-5rem)] transition-[width] duration-300 ease-in-out ${
                sidebarExpanded ? "w-[min(22rem,calc(100vw-2rem))]" : "w-14"
              }`}
              aria-label="Search summary, filters, and compare tools"
            >
              <div className="flex rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden w-full min-h-[min(28rem,calc(100vh-6rem))] max-h-[calc(100vh-5rem)]">
                {/* Icon rail */}
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

                  {/* Search criteria summary (wizard steps 1–3) — above filters */}
                  <button
                    type="button"
                    onClick={() => { setSidebarExpanded(true); setSidebarPanel("summary"); }}
                    aria-label="Your search criteria from prescriptions, doctors, and pharmacies"
                    title="Your search"
                    className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors ${
                      sidebarPanel === "summary" ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="h-5 w-5" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                    </svg>
                  </button>

                  {/* Filters icon */}
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

                  {/* Compare icon — only when 2+ plans selected (comparison is meaningful) */}
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

                {/* Panel content */}
                {sidebarExpanded && (
                  <div className="flex-1 min-w-0 overflow-y-auto overscroll-contain px-3.5 py-3 border-l border-gray-100/80">
                    {sidebarPanel === "compare" && compared.length >= 2 ? (
                      <ComparePanel {...compareProps} />
                    ) : sidebarPanel === "summary" ? (
                      <SearchCriteriaPanel {...searchCriteriaProps} />
                    ) : (
                      <FilterPanel {...filterProps} />
                    )}
                  </div>
                )}
              </div>
            </aside>
          )}

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* ── Step 0: Prescriptions ── */}
            {wizardStep === 0 && (
              <div className="space-y-6 max-w-4xl">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">Add Your Prescriptions</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Add the drugs you take so we can estimate your annual costs and find plans that cover them. You can skip this step if you prefer.
                  </p>
                  <DrugSearch drugs={drugs} onDrugsChange={setDrugs} />
                </div>
                <div className="flex justify-between">
                  <button onClick={onBack} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={() => setWizardStep(1)} className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    {drugs.length > 0 ? `Next: Doctors (${drugs.length} drug${drugs.length !== 1 ? "s" : ""} added)` : "Skip & Continue"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 1: Doctors ── */}
            {wizardStep === 1 && (
              <div className="space-y-6 max-w-4xl">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">Add Your Doctors</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Add your doctors and specialists to see which plans include them in-network. You can skip this step too.
                  </p>
                  <ProviderSearch searchState={county.state} providers={providers} onProvidersChange={setProviders} />
                </div>
                <div className="flex justify-between">
                  <button onClick={() => setWizardStep(0)} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Back</button>
                  <button onClick={() => setWizardStep(2)} className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                    {providers.length > 0 ? `Next: Pharmacies (${providers.length} doctor${providers.length !== 1 ? "s" : ""} added)` : "Skip & Continue"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 2: Pharmacies ── */}
            {wizardStep === 2 && (
              <div className="space-y-6 max-w-4xl">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">Select Your Pharmacies</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Choose the pharmacies where you fill prescriptions so we can show in-network pricing. You can skip this step too.
                  </p>
                  <PharmacyPicker
                    zip={zip}
                    selectedPharmacies={selectedPharmacies}
                    onSelectionChange={setSelectedPharmacies}
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-800 mb-1">Ready to search</p>
                  <p className="text-xs text-blue-600">
                    {drugs.length} drug(s) &middot; {providers.length} provider(s) &middot; {selectedPharmacies.length} pharmacy(s) selected
                  </p>
                </div>
                <div className="flex justify-between">
                  <button onClick={() => setWizardStep(1)} className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Back</button>
                  <button onClick={handleFindPlans} className="px-8 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-md">Find Plans</button>
                </div>
              </div>
            )}

            {/* ── Step 3: Results ── */}
            {wizardStep === 3 && (
              <div>
                {!isLoading && plans.length > 0 && (
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      &larr; Modify search criteria
                    </button>
                  </div>
                )}

                {isLoading && (
                  <div className="text-center py-12">
                    <div className="inline-block h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="mt-3 text-gray-500">Fetching plans from Medicare.gov...</p>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">{error}</div>
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
                      <p className="text-sm text-gray-600 py-6">No plans match the selected filters. Adjust filters to see results.</p>
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
                                selectedIds.includes(plan.id) ? "border-blue-500" : "border-transparent"
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-semibold text-gray-800">{plan.name}</h3>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{categoryLabel(plan.category)}</span>
                                    {plan.overall_star_rating?.rating > 0 && (
                                      <span className="text-xs text-yellow-600 font-semibold">
                                        {"★".repeat(Math.floor(plan.overall_star_rating.rating))}
                                        {plan.overall_star_rating.rating % 1 >= 0.5 ? "½" : ""}{" "}
                                        {plan.overall_star_rating.rating}
                                      </span>
                                    )}
                                    {plan.high_performing && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-semibold">High Performing</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">{plan.organization_name}</p>

                                  <div className="flex items-baseline gap-4 mt-2 flex-wrap">
                                    <div>
                                      <span className="text-2xl font-bold text-blue-600">
                                        {formatCurrency(plan.partc_premium + plan.partd_premium)}
                                      </span>
                                      <span className="text-sm text-gray-500">/mo</span>
                                    </div>
                                    {plan.drug_plan_deductible > 0 && (
                                      <span className="text-xs text-gray-500">Drug deductible: {formatCurrency(plan.drug_plan_deductible)}</span>
                                    )}
                                    {drugs.length > 0 && plan.remaining_premium_and_drugs > 0 && (
                                      <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded font-semibold">
                                        Est. total: {formatCurrency(plan.remaining_premium_and_drugs)}/yr
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 flex-wrap">
                                    {plan.package_services?.outpatient_prescription === "AVAILABILITY_PROVIDED" && (
                                      <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded">Rx</span>
                                    )}
                                    {plan.package_services?.ms_dental_services && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Dental</span>}
                                    {plan.package_services?.ms_vision_services && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Vision</span>}
                                    {plan.package_services?.ms_hearing_services && <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">Hearing</span>}
                                    {plan.silver_sneakers && <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">SilverSneakers</span>}
                                    {plan.telehealth && <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Telehealth</span>}
                                    {plan.transportation && <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">Transport</span>}
                                    {plan.otc_drugs && <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">OTC</span>}
                                  </div>

                                  {(plan.primary_doctor_cost_sharing || plan.specialist_doctor_cost_sharing) && (
                                    <div className="mt-2 text-xs text-gray-600">
                                      <p className="font-medium text-gray-700 mb-0.5">Copays / coinsurance</p>
                                      <div className="flex gap-4 flex-wrap">
                                        {plan.primary_doctor_cost_sharing && (
                                          <span>
                                            Primary: ${plan.primary_doctor_cost_sharing.min_copay}
                                            {plan.primary_doctor_cost_sharing.max_copay !== plan.primary_doctor_cost_sharing.min_copay && `-$${plan.primary_doctor_cost_sharing.max_copay}`} copay
                                          </span>
                                        )}
                                        {plan.specialist_doctor_cost_sharing && (
                                          <span>
                                            Specialist: ${plan.specialist_doctor_cost_sharing.min_copay}
                                            {plan.specialist_doctor_cost_sharing.max_copay !== plan.specialist_doctor_cost_sharing.min_copay && `-$${plan.specialist_doctor_cost_sharing.max_copay}`} copay
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  <div className="mt-2">
                                    <button
                                      type="button"
                                      className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                      onClick={() => setMoreBenefitsOpen((prev) => ({ ...prev, [plan.id]: !prev[plan.id] }))}
                                    >
                                      {moreBenefitsOpen[plan.id] ? "Hide extra benefits" : "See more benefits"}
                                    </button>
                                    {moreBenefitsOpen[plan.id] && (
                                      <ul className="mt-1.5 text-xs text-gray-600 list-disc list-inside space-y-0.5">
                                        {plan.partb_premium_reduction > 0 && (
                                          <li>
                                            <span className="font-medium text-gray-700">Part B premium reduction: </span>
                                            {formatCurrency(plan.partb_premium_reduction)}/mo
                                          </li>
                                        )}
                                        {(() => {
                                          const snpLabel = labelSnpType(plan.snp_type);
                                          return snpLabel ? (
                                            <li>
                                              <span className="font-medium text-gray-700">Special Needs Plan: </span>
                                              {snpLabel}
                                            </li>
                                          ) : null;
                                        })()}
                                        {plan.package_services?.doctor_choice && (
                                          <li>
                                            <span className="font-medium text-gray-700">Doctor choice: </span>
                                            {labelAvailabilityCode(plan.package_services.doctor_choice)}
                                          </li>
                                        )}
                                        {plan.package_services?.outpatient_prescription && (
                                          <li>
                                            <span className="font-medium text-gray-700">Outpatient prescriptions: </span>
                                            {labelAvailabilityCode(plan.package_services.outpatient_prescription)}
                                          </li>
                                        )}
                                        {plan.package_services?.dental_services && (
                                          <li>
                                            <span className="font-medium text-gray-700">Dental: </span>
                                            {labelAvailabilityCode(plan.package_services.dental_services)}
                                          </li>
                                        )}
                                        {plan.package_services?.vision_services && (
                                          <li>
                                            <span className="font-medium text-gray-700">Vision: </span>
                                            {labelAvailabilityCode(plan.package_services.vision_services)}
                                          </li>
                                        )}
                                        {plan.package_services?.hearing_services && (
                                          <li>
                                            <span className="font-medium text-gray-700">Hearing: </span>
                                            {labelAvailabilityCode(plan.package_services.hearing_services)}
                                          </li>
                                        )}
                                        {plan.telehealth && (
                                          <li>
                                            <span className="font-medium text-gray-700">Telehealth: </span>
                                            Included
                                          </li>
                                        )}
                                        {plan.otc_drugs && (
                                          <li>
                                            <span className="font-medium text-gray-700">OTC products: </span>
                                            Benefit available (see plan)
                                          </li>
                                        )}
                                        <li className="text-gray-500 list-none -ml-3 mt-1">
                                          Use <span className="font-medium">Full comparison</span> for complete plan features and cost sharing.
                                        </li>
                                      </ul>
                                    )}
                                  </div>
                                </div>
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(plan.id)}
                                  disabled={!selectedIds.includes(plan.id) && selectedIds.length >= MAX_MA_COMPARE}
                                  onChange={() => toggleSelect(plan.id)}
                                  className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1 disabled:opacity-40"
                                  title={selectedIds.length >= MAX_MA_COMPARE && !selectedIds.includes(plan.id) ? `Select up to ${MAX_MA_COMPARE} plans` : "Select for comparison"}
                                />
                              </div>

                              {plan.url && (
                                <div className="mt-2 flex flex-wrap gap-2 items-center">
                                  <a
                                    href={plan.url.startsWith("http") ? plan.url : `https://${plan.url}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-lg"
                                  >
                                    Plan details
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {sorted.length > 0 && totalPages > 1 && (
                          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                            <button onClick={() => setCurrentPage(0)} disabled={currentPage === 0} className="px-3 py-2 sm:py-1.5 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0 hidden sm:inline-flex">First</button>
                            <button onClick={() => setCurrentPage((p) => Math.max(0, p - 1))} disabled={currentPage === 0} className="px-3 py-2 sm:py-1.5 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0">&larr; Prev</button>
                            <span className="px-4 py-1.5 text-sm font-semibold text-blue-600">{currentPage + 1} / {totalPages}</span>
                            <button onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} className="px-3 py-2 sm:py-1.5 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0">Next &rarr;</button>
                            <button onClick={() => setCurrentPage(totalPages - 1)} disabled={currentPage >= totalPages - 1} className="px-3 py-2 sm:py-1.5 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] sm:min-h-0 hidden sm:inline-flex">Last</button>
                          </div>
                        )}
                      </Fragment>
                    )}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      <MACompareModal
        open={maCompareOpen}
        onClose={closeMaCompare}
        plans={maComparePlans}
        planDetails={maCompareDetails}
        zip={zip}
        drugNames={drugs.map((d) => d.name)}
        onRemovePlan={(planId) => {
          const idx = maComparePlans.findIndex(
            (p) => `${p.contract_id}-${p.plan_id}-${p.segment_id}` === planId
          );
          if (idx < 0) return;
          const nextPlans = maComparePlans.filter((_, i) => i !== idx);
          const nextDetails = maCompareDetails.filter((_, i) => i !== idx);
          if (nextPlans.length < 2) {
            closeMaCompare();
          } else {
            setMaComparePlans(nextPlans);
            setMaCompareDetails(nextDetails);
          }
          setSelectedIds((prev) => {
            const removedPlan = maComparePlans[idx];
            return removedPlan ? prev.filter((id) => id !== removedPlan.id) : prev;
          });
        }}
      />
    </div>
  );
}
