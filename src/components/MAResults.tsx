"use client";

import { Fragment, useMemo, useState } from "react";
import { MAPlan, County, MAPlanDetail } from "@/types";
import { fetchMAPlans, fetchPlanDetail } from "@/providers/quoteProvider";
import DrugSearch, { SelectedDrug } from "./DrugSearch";
import PharmacyPicker from "./PharmacyPicker";
import ProviderSearch, { SelectedProvider } from "./ProviderSearch";
import StepTracker from "./StepTracker";
import MACompareModal from "./MACompareModal";

const MAX_MA_COMPARE = 3;

type Props = {
  zip: string;
  county: County;
  onBack: () => void;
};

type WizardStep = 0 | 1 | 2 | 3; // prescriptions, doctors, pharmacies, results

const STEPS = [
  { label: "Prescriptions" },
  { label: "Doctors" },
  { label: "Pharmacies" },
  { label: "Results" },
];

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

export default function MAResults({ zip, county, onBack }: Props) {
  const [wizardStep, setWizardStep] = useState<WizardStep>(0);
  const [drugs, setDrugs] = useState<SelectedDrug[]>([]);
  const [pharmacyNpis, setPharmacyNpis] = useState<string[]>([]);
  const [providers, setProviders] = useState<SelectedProvider[]>([]);

  // Results state
  const [plans, setPlans] = useState<MAPlan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [maCompareOpen, setMaCompareOpen] = useState(false);
  const [maCompareLoading, setMaCompareLoading] = useState(false);
  const [maCompareDetails, setMaCompareDetails] = useState<MAPlanDetail[]>([]);
  const [maComparePlans, setMaComparePlans] = useState<MAPlan[]>([]);
  const [maCompareError, setMaCompareError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<
    "premium" | "stars" | "drugcost" | "healthded"
  >("premium");
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
        pharmacyNpis,
        prescriptions
      );

      setPlans(results);
      setCurrentPage(0);
      if (results.length === 0) {
        setError("No Medicare Advantage plans found for this area.");
      }
    } catch (e) {
      console.error("[MAResults] Fetch error:", e);
      setError(
        e instanceof Error ? e.message : "Failed to fetch plans."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_MA_COMPARE) return prev;
      return [...prev, id];
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
        ordered.map((p) =>
          fetchPlanDetail(year, p.contract_id, p.plan_id, p.segment_id)
        )
      );
      setMaComparePlans(ordered);
      setMaCompareDetails(details);
      setMaCompareOpen(true);
    } catch (e) {
      console.error("[MAResults] Plan detail fetch:", e);
      setMaCompareError(
        e instanceof Error ? e.message : "Failed to load plan details."
      );
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
      if (filterCarriers.length > 0 && !filterCarriers.includes(p.organization_name)) {
        return false;
      }
      if (filterStars.length > 0) {
        const b = starBucket(p.overall_star_rating?.rating);
        if (!filterStars.includes(b)) return false;
      }
      if (filterMapdOnly && p.plan_type !== "PLAN_TYPE_MAPD") return false;

      const wantPlanType = filterHmo || filterPpo;
      if (wantPlanType) {
        const isHmo = p.category.includes("HMO");
        const isPpo = p.category.includes("PPO");
        const match =
          (filterHmo && isHmo) || (filterPpo && isPpo);
        if (!match) return false;
      }

      if (filterVision && !p.package_services?.ms_vision_services) return false;
      if (filterDental && !p.package_services?.ms_dental_services) return false;
      if (filterHearing && !p.package_services?.ms_hearing_services) return false;
      if (filterTransport && !p.transportation) return false;
      if (filterFitness && !p.silver_sneakers) return false;

      return true;
    });
  }, [
    plans,
    filterCarriers,
    filterStars,
    filterMapdOnly,
    filterHmo,
    filterPpo,
    filterVision,
    filterDental,
    filterHearing,
    filterTransport,
    filterFitness,
  ]);

  const sorted = [...filteredPlans].sort((a, b) => {
    if (sortBy === "stars") {
      return (
        (b.overall_star_rating?.rating ?? 0) -
        (a.overall_star_rating?.rating ?? 0)
      );
    }
    if (sortBy === "drugcost") {
      return a.remaining_premium_and_drugs - b.remaining_premium_and_drugs;
    }
    if (sortBy === "healthded") {
      return parseHealthDeductible(a.annual_deductible) - parseHealthDeductible(b.annual_deductible);
    }
    return (
      a.partc_premium + a.partd_premium - (b.partc_premium + b.partd_premium)
    );
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const paginatedPlans = sorted.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const compared = selectedIds
    .map((id) => plans.find((p) => p.id === id))
    .filter((p): p is MAPlan => !!p);

  // Summary pill for the header
  const summaryParts: string[] = [];
  if (drugs.length > 0) summaryParts.push(`${drugs.length} drug(s)`);
  if (providers.length > 0) summaryParts.push(`${providers.length} provider(s)`);
  if (pharmacyNpis.length > 0) summaryParts.push(`${pharmacyNpis.length} pharmacy(s)`);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={wizardStep === 0 ? onBack : () => setWizardStep((wizardStep - 1) as WizardStep)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium mb-1"
          >
            &larr; {wizardStep === 0 ? "Back to plan selection" : "Back"}
          </button>
          <h1 className="text-xl font-bold text-gray-800">
            Medicare Advantage Plans
          </h1>
          <p className="text-xs text-gray-500">
            {county.name} County, {county.state} ({zip})
            {summaryParts.length > 0 && ` · ${summaryParts.join(" · ")}`}
          </p>
        </div>
      </header>

      {/* Progress tracker */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4">
          <StepTracker steps={STEPS} currentStep={wizardStep} />
        </div>
      </div>

      {/* Step content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* ── Step 0: Prescriptions ── */}
        {wizardStep === 0 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                Add Your Prescriptions
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Add the drugs you take so we can estimate your annual costs and
                find plans that cover them. You can skip this step if you prefer.
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
                  ? `Next: Doctors (${drugs.length} drug${drugs.length !== 1 ? "s" : ""} added)`
                  : "Skip & Continue"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Doctors ── */}
        {wizardStep === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                Add Your Doctors
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Add your doctors and specialists to see which plans include them
                in-network. You can skip this step too.
              </p>
              <ProviderSearch
                searchState={county.state}
                providers={providers}
                onProvidersChange={setProviders}
              />
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setWizardStep(0)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setWizardStep(2)}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {providers.length > 0
                  ? `Next: Pharmacies (${providers.length} doctor${providers.length !== 1 ? "s" : ""} added)`
                  : "Skip & Continue"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Pharmacies ── */}
        {wizardStep === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-1">
                Select Your Pharmacies
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                Choose the pharmacies where you fill prescriptions so we can show
                in-network pricing. You can skip this step too.
              </p>
              <PharmacyPicker
                zip={zip}
                selectedNpis={pharmacyNpis}
                onSelectionChange={setPharmacyNpis}
              />
            </div>

            {/* Summary before search */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800 mb-1">
                Ready to search
              </p>
              <p className="text-xs text-blue-600">
                {drugs.length} drug(s) &middot; {providers.length} provider(s) &middot; {pharmacyNpis.length} pharmacy(s) selected
              </p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setWizardStep(1)}
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

        {/* ── Step 3: Results ── */}
        {wizardStep === 3 && (
          <div>
            {/* Sort controls */}
            {!isLoading && plans.length > 0 && (
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    &larr; Modify search criteria
                  </button>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(
                          e.target.value as "premium" | "stars" | "drugcost" | "healthded"
                        );
                        setCurrentPage(0);
                      }}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="premium">Monthly Premium</option>
                      <option value="healthded">Lowest health plan deductible</option>
                      <option value="stars">Star Rating</option>
                      {drugs.length > 0 && (
                        <option value="drugcost">Est. Total Cost (drug + premium)</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-3 text-sm">
                  <p className="font-semibold text-gray-800 mb-2">Filters</p>
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 font-medium">Health plan type</p>
                      <label className="inline-flex items-center gap-2 text-xs mr-3">
                        <input
                          type="checkbox"
                          checked={filterHmo}
                          onChange={() => {
                            setFilterHmo((v) => !v);
                            setCurrentPage(0);
                          }}
                          className="rounded border-gray-300"
                        />
                        HMO
                      </label>
                      <label className="inline-flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={filterPpo}
                          onChange={() => {
                            setFilterPpo((v) => !v);
                            setCurrentPage(0);
                          }}
                          className="rounded border-gray-300"
                        />
                        PPO (incl. regional)
                      </label>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500 font-medium">Drug coverage</p>
                      <label className="inline-flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={filterMapdOnly}
                          onChange={() => {
                            setFilterMapdOnly((v) => !v);
                            setCurrentPage(0);
                          }}
                          className="rounded border-gray-300"
                        />
                        MAPD only (includes drug coverage)
                      </label>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Plan benefits</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {(
                          [
                            ["Vision", filterVision, setFilterVision],
                            ["Dental", filterDental, setFilterDental],
                            ["Hearing", filterHearing, setFilterHearing],
                            ["Transportation", filterTransport, setFilterTransport],
                            ["Fitness", filterFitness, setFilterFitness],
                          ] as const
                        ).map(([label, checked, setFn]) => (
                          <label key={label} className="inline-flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setFn((v) => !v);
                                setCurrentPage(0);
                              }}
                              className="rounded border-gray-300"
                            />
                            {label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Insurance carriers</p>
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                        {carrierOptions.map((name) => (
                          <label key={name} className="inline-flex items-center gap-1 text-xs">
                            <input
                              type="checkbox"
                              checked={filterCarriers.includes(name)}
                              onChange={() => {
                                setFilterCarriers((prev) =>
                                  prev.includes(name)
                                    ? prev.filter((x) => x !== name)
                                    : [...prev, name]
                                );
                                setCurrentPage(0);
                              }}
                              className="rounded border-gray-300"
                            />
                            <span className="text-gray-700 max-w-[10rem] truncate" title={name}>
                              {name}
                            </span>
                          </label>
                        ))}
                      </div>
                      {filterCarriers.length > 0 && (
                        <button
                          type="button"
                          className="text-xs text-blue-600 mt-1 hover:underline"
                          onClick={() => setFilterCarriers([])}
                        >
                          Clear carriers
                        </button>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Star ratings</p>
                      <div className="flex flex-wrap gap-2">
                        {([5, 4, 3, 2, 1, "nr"] as const).map((s) => (
                          <label key={String(s)} className="inline-flex items-center gap-1 text-xs">
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
                            <span className="text-gray-700">
                              {s === "nr" ? "Not rated" : `${s}★`}
                            </span>
                          </label>
                        ))}
                      </div>
                      {filterStars.length > 0 && (
                        <button
                          type="button"
                          className="text-xs text-blue-600 mt-1 hover:underline"
                          onClick={() => setFilterStars([])}
                        >
                          Clear stars
                        </button>
                      )}
                    </div>
                  </div>
                  {filteredPlans.length < plans.length && (
                    <p className="text-xs text-gray-500 mt-2">
                      Showing {filteredPlans.length} of {plans.length} plans
                    </p>
                  )}
                </div>
              </div>
            )}

            {isLoading && (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="mt-3 text-gray-500">
                  Fetching plans from Medicare.gov...
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
                {error}
              </div>
            )}

            {/* Comparison table */}
            {compared.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Compare ({compared.length}/{MAX_MA_COMPARE})
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={compared.length < 2 || maCompareLoading}
                      onClick={openFullComparison}
                      className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {maCompareLoading ? "Loading full comparison…" : "Full comparison"}
                    </button>
                    <button
                      onClick={() => setSelectedIds([])}
                      className="text-sm text-red-600 hover:text-red-800 font-medium px-2"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                {maCompareError && (
                  <p className="text-sm text-red-600 mb-3">{maCompareError}</p>
                )}
                <p className="text-xs text-gray-500 mb-3">
                  Quick summary — up to {MAX_MA_COMPARE} plans. Use{" "}
                  <span className="font-semibold">Full comparison</span> for Medicare.gov-style
                  detail (deductibles, features, benefits, drug info).
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 pr-4 font-medium text-gray-600">
                          Plan
                        </th>
                        <th className="text-left py-2 pr-4 font-medium text-gray-600">
                          Organization
                        </th>
                        <th className="text-left py-2 pr-4 font-medium text-gray-600">
                          Type
                        </th>
                        <th className="text-right py-2 pr-4 font-medium text-gray-600">
                          Premium
                        </th>
                        <th className="text-right py-2 pr-4 font-medium text-gray-600">
                          Drug Ded.
                        </th>
                        {drugs.length > 0 && (
                          <th className="text-right py-2 pr-4 font-medium text-gray-600">
                            Est. Drug Cost
                          </th>
                        )}
                        <th className="text-center py-2 font-medium text-gray-600">
                          Stars
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {compared.map((p) => (
                        <tr key={p.id} className="border-b border-gray-100">
                          <td className="py-2 pr-4 font-medium text-gray-800 text-xs">
                            {p.name}
                          </td>
                          <td className="py-2 pr-4 text-gray-600 text-xs">
                            {p.organization_name}
                          </td>
                          <td className="py-2 pr-4 text-gray-600 text-xs">
                            {categoryLabel(p.category)}
                          </td>
                          <td className="py-2 pr-4 text-right font-semibold text-blue-600">
                            {formatCurrency(p.partc_premium + p.partd_premium)}
                          </td>
                          <td className="py-2 pr-4 text-right text-gray-600">
                            {formatCurrency(p.drug_plan_deductible)}
                          </td>
                          {drugs.length > 0 && (
                            <td className="py-2 pr-4 text-right text-gray-600">
                              {p.annual_drugs_total > 0
                                ? formatCurrency(p.annual_drugs_total)
                                : "N/A"}
                            </td>
                          )}
                          <td className="py-2 text-center text-yellow-500 font-semibold">
                            {p.overall_star_rating?.rating > 0
                              ? p.overall_star_rating.rating
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Plan cards */}
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
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {categoryLabel(plan.category)}
                            </span>
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
                            {plan.high_performing && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-semibold">
                                High Performing
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{plan.organization_name}</p>
                          <p className="text-xs font-mono text-gray-700 mt-0.5 font-medium">
                            Plan ID: {plan.contract_id}-{plan.plan_id}-{plan.segment_id}
                          </p>

                          <div className="flex items-baseline gap-4 mt-2 flex-wrap">
                            <div>
                              <span className="text-2xl font-bold text-blue-600">
                                {formatCurrency(
                                  plan.partc_premium + plan.partd_premium
                                )}
                              </span>
                              <span className="text-sm text-gray-500">/mo</span>
                            </div>
                            {plan.drug_plan_deductible > 0 && (
                              <span className="text-xs text-gray-500">
                                Drug deductible:{" "}
                                {formatCurrency(plan.drug_plan_deductible)}
                              </span>
                            )}
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

                          {/* Benefits row */}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 flex-wrap">
                            {plan.package_services?.outpatient_prescription ===
                              "AVAILABILITY_PROVIDED" && (
                              <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded">
                                Rx
                              </span>
                            )}
                            {plan.package_services?.ms_dental_services && (
                              <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                                Dental
                              </span>
                            )}
                            {plan.package_services?.ms_vision_services && (
                              <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                                Vision
                              </span>
                            )}
                            {plan.package_services?.ms_hearing_services && (
                              <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
                                Hearing
                              </span>
                            )}
                            {plan.silver_sneakers && (
                              <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                                SilverSneakers
                              </span>
                            )}
                            {plan.telehealth && (
                              <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                                Telehealth
                              </span>
                            )}
                            {plan.transportation && (
                              <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                                Transport
                              </span>
                            )}
                            {plan.otc_drugs && (
                              <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">
                                OTC
                              </span>
                            )}
                          </div>

                          {/* Cost sharing */}
                          {(plan.primary_doctor_cost_sharing ||
                            plan.specialist_doctor_cost_sharing) && (
                            <div className="mt-2 text-xs text-gray-600">
                              <p className="font-medium text-gray-700 mb-0.5">
                                Copays / coinsurance (search)
                              </p>
                              <div className="flex gap-4 flex-wrap">
                                {plan.primary_doctor_cost_sharing && (
                                  <span>
                                    Primary doctor: $
                                    {plan.primary_doctor_cost_sharing.min_copay}
                                    {plan.primary_doctor_cost_sharing.max_copay !==
                                      plan.primary_doctor_cost_sharing.min_copay &&
                                      `-$${plan.primary_doctor_cost_sharing.max_copay}`}{" "}
                                    copay
                                  </span>
                                )}
                                {plan.specialist_doctor_cost_sharing && (
                                  <span>
                                    Specialist: $
                                    {plan.specialist_doctor_cost_sharing.min_copay}
                                    {plan.specialist_doctor_cost_sharing.max_copay !==
                                      plan.specialist_doctor_cost_sharing.min_copay &&
                                      `-$${plan.specialist_doctor_cost_sharing.max_copay}`}{" "}
                                    copay
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="mt-2">
                            <button
                              type="button"
                              className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                              onClick={() =>
                                setMoreBenefitsOpen((prev) => ({
                                  ...prev,
                                  [plan.id]: !prev[plan.id],
                                }))
                              }
                            >
                              {moreBenefitsOpen[plan.id]
                                ? "Hide extra benefits"
                                : "See more benefits"}
                            </button>
                            {moreBenefitsOpen[plan.id] && (
                              <ul className="mt-1.5 text-xs text-gray-600 list-disc list-inside space-y-0.5">
                                {plan.partb_premium_reduction > 0 && (
                                  <li>
                                    Part B premium reduction:{" "}
                                    {formatCurrency(plan.partb_premium_reduction)}/mo
                                  </li>
                                )}
                                {plan.snp_type ? <li>SNP: {plan.snp_type}</li> : null}
                                {plan.package_services?.doctor_choice && (
                                  <li>Doctor choice: {plan.package_services.doctor_choice}</li>
                                )}
                                {plan.package_services?.outpatient_prescription && (
                                  <li>
                                    Outpatient prescription:{" "}
                                    {plan.package_services.outpatient_prescription}
                                  </li>
                                )}
                                {plan.package_services?.dental_services && (
                                  <li>Dental (summary): {plan.package_services.dental_services}</li>
                                )}
                                {plan.package_services?.vision_services && (
                                  <li>Vision (summary): {plan.package_services.vision_services}</li>
                                )}
                                {plan.package_services?.hearing_services && (
                                  <li>Hearing (summary): {plan.package_services.hearing_services}</li>
                                )}
                                {plan.telehealth && <li>Telehealth</li>}
                                {plan.otc_drugs && <li>OTC drug benefit</li>}
                                <li className="text-gray-500 list-none -ml-3 mt-1">
                                  Use <span className="font-medium">Full comparison</span> for
                                  complete plan features and cost sharing.
                                </li>
                              </ul>
                            )}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(plan.id)}
                          disabled={
                            !selectedIds.includes(plan.id) &&
                            selectedIds.length >= MAX_MA_COMPARE
                          }
                          onChange={() => toggleSelect(plan.id)}
                          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1 disabled:opacity-40"
                          title={
                            selectedIds.length >= MAX_MA_COMPARE &&
                            !selectedIds.includes(plan.id)
                              ? `Select up to ${MAX_MA_COMPARE} plans`
                              : "Select for comparison"
                          }
                        />
                      </div>

                      {plan.url && (
                        <div className="mt-2 flex flex-wrap gap-2 items-center">
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
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination controls */}
                {sorted.length > 0 && totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                      onClick={() => setCurrentPage(0)}
                      disabled={currentPage === 0}
                      className="px-3 py-1.5 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                      className="px-3 py-1.5 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      &larr; Prev
                    </button>
                    <span className="px-4 py-1.5 text-sm font-semibold text-blue-600">
                      {currentPage + 1} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage >= totalPages - 1}
                      className="px-3 py-1.5 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next &rarr;
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages - 1)}
                      disabled={currentPage >= totalPages - 1}
                      className="px-3 py-1.5 text-sm font-medium rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
        )}
      </main>
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
