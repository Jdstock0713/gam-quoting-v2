"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { MAPlan, MAPlanDetail, PharmacyCostRow, DrugCoverageRow } from "@/types";
import {
  pickDetail,
  cellString,
  extractFeatureMap,
  extractBenefitRows,
  extractDrugSection,
  extractExtraSections,
  REQUIRED_BENEFIT_KEYS,
  buildBenefitRowTextsForPlan,
  extractPharmacyBreakdownFromPlan,
  extractStructuredExtraRows,
  mergePharmacyCostTables,
  extractDrugCoverageStatus,
  EXPLICIT_FEATURE_LOOKUPS,
} from "@/lib/maPlanDetailParse";

const STANDARD_PART_B_PREMIUM: Record<number, number> = {
  2025: 185.0,
  2026: 202.9,
};

type Props = {
  open: boolean;
  onClose: () => void;
  plans: MAPlan[];
  planDetails: MAPlanDetail[];
  zip: string;
  drugNames?: string[];
  onRemovePlan?: (planId: string) => void;
};

function formatCurrency(n: number): string {
  return `$${n.toFixed(2)}`;
}

function rowValuesDiffer(values: string[]): boolean {
  return new Set(values).size > 1;
}

function cellIsMinorityValue(values: string[], index: number): boolean {
  if (values.length < 2 || !rowValuesDiffer(values)) return false;
  const counts: Record<string, number> = {};
  for (const v of values) {
    counts[v] = (counts[v] || 0) + 1;
  }
  const maxCount = Math.max(...Object.values(counts));
  if (maxCount <= 1) return false;
  const v = values[index];
  return counts[v]! < maxCount;
}

function StarRow({ rating }: { rating: number }) {
  if (!rating || rating <= 0) return <span className="text-gray-400">Not rated</span>;
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span className="text-amber-500 font-semibold" title={`${rating} of 5`}>
      {"★".repeat(full)}
      {half ? "½" : ""}
      <span className="text-gray-600 text-sm ml-1">{rating}</span>
    </span>
  );
}

function boolMark(v: boolean): ReactNode {
  return v ? (
    <span className="text-emerald-600 font-bold">✓</span>
  ) : (
    <span className="text-red-500 font-bold">✗</span>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 shrink-0 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PharmacyCostMiniTable({ rows }: { rows: PharmacyCostRow[] }) {
  if (!rows.length) return <span className="text-gray-400">—</span>;
  const sorted = [...rows].sort((a, b) => a.estimatedAnnualCost - b.estimatedAnnualCost);
  return (
    <div className="space-y-1">
      {sorted.map((r, i) => (
        <div key={i} className="flex items-start justify-between gap-2 text-xs">
          <div className="min-w-0">
            <span className="font-medium text-gray-800">{r.pharmacyName}</span>
            {r.networkTier && (
              <span className={`ml-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${
                r.networkTier === "Preferred" ? "bg-emerald-100 text-emerald-700" :
                r.networkTier === "Standard" ? "bg-gray-100 text-gray-600" :
                "bg-amber-100 text-amber-700"
              }`}>
                {r.networkTier}
              </span>
            )}
          </div>
          <span className="font-semibold text-gray-900 whitespace-nowrap">
            ${r.estimatedAnnualCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      ))}
    </div>
  );
}

function DrugCoverageList({ rows }: { rows: DrugCoverageRow[] }) {
  if (!rows.length) return <span className="text-gray-400">—</span>;
  const covered = rows.filter((r) => r.covered).length;
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-gray-700">
        {covered} of {rows.length} drugs covered
      </div>
      {rows.map((r, i) => (
        <div key={i} className="flex items-start gap-1.5 text-xs">
          {r.covered ? (
            <span className="text-emerald-600 font-bold shrink-0">✓</span>
          ) : (
            <span className="text-red-500 font-bold shrink-0">✗</span>
          )}
          <div className="min-w-0">
            <span className={r.covered ? "text-gray-800" : "text-red-600"}>{r.drugName}</span>
            {r.tier && <span className="ml-1 text-gray-500">({r.tier})</span>}
            {r.restrictions && <span className="ml-1 text-amber-600 text-[10px]">{r.restrictions}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MACompareModal({
  open,
  onClose,
  plans,
  planDetails,
  zip,
  drugNames = [],
  onRemovePlan,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    planFeatures: true,
    benefitsCosts: true,
    extraBenefits: true,
    drugCoverage: true,
  });

  const toggleSection = useCallback((key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const allExpanded = Object.values(expandedSections).every(Boolean);
  const toggleAll = useCallback(() => {
    setExpandedSections((prev) => {
      const target = !Object.values(prev).every(Boolean);
      return Object.fromEntries(Object.keys(prev).map((k) => [k, target]));
    });
  }, []);

  const handlePrint = useCallback(() => {
    setExpandedSections((prev) =>
      Object.fromEntries(Object.keys(prev).map((k) => [k, true]))
    );
    setTimeout(() => window.print(), 50);
  }, []);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("life-compare-modal-open");
    return () => document.body.classList.remove("life-compare-modal-open");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const overviewRows = useMemo(() => {
    const rows: { label: string; values: string[]; rich?: ReactNode[] }[] = [];

    rows.push({
      label: "Star rating",
      values: plans.map((p) =>
        p.overall_star_rating?.rating > 0 ? String(p.overall_star_rating.rating) : "—"
      ),
      rich: plans.map((p) => (
        <StarRow key={`star-${p.id}`} rating={p.overall_star_rating?.rating ?? 0} />
      )),
    });

    rows.push({
      label: "Health deductible",
      values: plans.map((p) => p.annual_deductible || "—"),
    });

    rows.push({
      label: "Drug plan deductible",
      values: plans.map((p) => formatCurrency(p.drug_plan_deductible)),
    });

    rows.push({
      label: "Maximum you pay (MOOP)",
      values: plans.map((p) => p.maximum_oopc || "—"),
    });

    rows.push({
      label: "Part C (medical) premium / mo",
      values: plans.map((p) => formatCurrency(p.partc_premium)),
    });

    rows.push({
      label: "Part D (drug) premium / mo",
      values: plans.map((p) => formatCurrency(p.partd_premium)),
    });

    rows.push({
      label: "Combined MA + drug premium / mo",
      values: plans.map((p) => formatCurrency(p.partc_premium + p.partd_premium)),
    });

    rows.push({
      label: "Part B premium reduction",
      values: plans.map((p) =>
        p.partb_premium_reduction > 0
          ? formatCurrency(p.partb_premium_reduction)
          : "Not offered"
      ),
    });

    rows.push({
      label: "Standard Part B premium (ref.)",
      values: plans.map((p, i) => {
        const d = planDetails[i];
        if (d) {
          const v = pickDetail(d, [
            "standard_part_b_premium",
            "standardPartBPremium",
            "part_b_premium",
          ]);
          if (v !== undefined) return cellString(v, 80);
        }
        const yr = parseInt(p.contract_year, 10);
        const fallback = STANDARD_PART_B_PREMIUM[yr];
        return fallback !== undefined ? formatCurrency(fallback) : "See Medicare.gov";
      }),
    });

    const oonVals = plans.map((_, i) => {
      const v = planDetails[i]
        ? pickDetail(planDetails[i]!, [
            "maximum_oopc_out_of_network",
            "moop_out_of_network",
            "out_of_network_moop",
          ])
        : undefined;
      return v !== undefined ? cellString(v) : "—";
    });
    if (oonVals.some((v) => v !== "—")) {
      rows.push({
        label: "MOOP (out-of-network)",
        values: oonVals,
      });
    }

    return rows;
  }, [plans, planDetails]);

  const planFeatureRows = useMemo(() => {
    const staticLabels: { label: string; get: (p: MAPlan) => boolean }[] = [
      { label: "Vision", get: (p) => !!p.package_services?.ms_vision_services },
      { label: "Dental", get: (p) => !!p.package_services?.ms_dental_services },
      { label: "Hearing", get: (p) => !!p.package_services?.ms_hearing_services },
      { label: "Transportation", get: (p) => p.transportation },
      { label: "Fitness benefits (e.g. SilverSneakers)", get: (p) => p.silver_sneakers },
      { label: "Telehealth", get: (p) => p.telehealth },
      { label: "Over-the-counter drug benefits", get: (p) => p.otc_drugs },
    ];

    const staticLabelSet = new Set(staticLabels.map((s) => s.label.toLowerCase()));
    staticLabelSet.add("part b premium reduction (offered)");
    for (const [label] of EXPLICIT_FEATURE_LOOKUPS) staticLabelSet.add(label.toLowerCase());

    const dynamicKeys = new Set<string>();
    for (const d of planDetails) {
      const m = extractFeatureMap(d);
      for (const k of Array.from(m.keys())) dynamicKeys.add(k);
    }

    const rows: { label: string; values: boolean[] }[] = [];

    for (const { label, get } of staticLabels) {
      rows.push({ label, values: plans.map(get) });
    }

    rows.push({
      label: "Part B premium reduction (offered)",
      values: plans.map((p) => p.partb_premium_reduction > 0),
    });

    for (const [label] of EXPLICIT_FEATURE_LOOKUPS) {
      rows.push({
        label,
        values: plans.map((_, i) => {
          const d = planDetails[i];
          if (!d) return false;
          return extractFeatureMap(d).get(label) ?? false;
        }),
      });
    }

    for (const key of Array.from(dynamicKeys).sort()) {
      if (staticLabelSet.has(key.toLowerCase())) continue;
      rows.push({
        label: key,
        values: plans.map((_, i) => {
          const d = planDetails[i];
          if (!d) return false;
          return extractFeatureMap(d).get(key) ?? false;
        }),
      });
    }

    return rows;
  }, [plans, planDetails]);

  const benefitRows = useMemo(() => {
    return REQUIRED_BENEFIT_KEYS.map((req) => ({
      label: req.label,
      values: plans.map((plan, i) => {
        const d = planDetails[i];
        const dyn = d ? extractBenefitRows(d) : [];
        const m = buildBenefitRowTextsForPlan(d, plan, dyn);
        return m.get(req.key) ?? "—";
      }),
    }));
  }, [plans, planDetails]);

  const structuredExtras = useMemo(
    () => planDetails.map((d) => extractStructuredExtraRows(d)),
    [planDetails]
  );

  const extraTableKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const rows of structuredExtras) {
      for (const r of rows) {
        keys.add(`${r.section}|||${r.label}`);
      }
    }
    return Array.from(keys).sort();
  }, [structuredExtras]);

  const drugColumnTexts = useMemo(
    () =>
      plans.map((plan, i) => {
        const d = planDetails[i];
        const pharmacy = extractPharmacyBreakdownFromPlan(plan);
        const fromDetail = d ? extractDrugSection(d) : "";
        const parts = [pharmacy, fromDetail].filter(Boolean);
        return parts.length ? parts.join("\n\n") : "—";
      }),
    [plans, planDetails]
  );

  const pharmacyCostTables = useMemo(
    () => plans.map((plan, i) => mergePharmacyCostTables(plan, planDetails[i])),
    [plans, planDetails]
  );

  const drugCoveragePerPlan = useMemo(
    () =>
      planDetails.map((d) => extractDrugCoverageStatus(d, drugNames)),
    [planDetails, drugNames]
  );

  if (!mounted || !open || plans.length === 0) return null;

  const modal = (
    <div
      className="life-compare-portal fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/50 print:bg-white print:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ma-compare-title"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-[100rem] w-full max-h-[95vh] flex flex-col overflow-hidden border border-gray-200 print:shadow-none print:border-0 print:max-w-none print:max-h-none">
        <div className="life-compare-no-print flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 bg-slate-50">
          <h2 id="ma-compare-title" className="text-lg font-bold text-gray-900">
            Compare Medicare Advantage plans
          </h2>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button
              type="button"
              onClick={toggleAll}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-600"
            >
              {allExpanded ? "Collapse all" : "Expand all"}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-800"
            >
              Print
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              title="Opens the print dialog — choose Save as PDF as the destination"
            >
              Save as PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium rounded-lg text-gray-600 hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>

        <div className="overflow-auto flex-1 p-4 md:p-6 print:overflow-visible">
          <p className="text-xs text-gray-500 mb-4">
            ZIP {zip}. Rows with differences are shaded; verify details on{" "}
            <a
              href="https://www.medicare.gov/plan-compare/"
              className="text-blue-700 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Medicare.gov
            </a>{" "}
            before enrolling.
          </p>

          <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
            <table className="compare-print-table w-full min-w-[720px] text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th
                    scope="col"
                    className="compare-sticky-col sticky left-0 z-[2] text-left py-3 pr-3 pl-1 font-semibold text-gray-700 bg-slate-50 w-[11rem] min-w-[11rem] align-top shadow-[2px_0_0_0_rgba(0,0,0,0.04)] print:bg-white print:static print:shadow-none"
                  >
                    Detail
                  </th>
                  {plans.map((p) => (
                    <th
                      key={p.id}
                      scope="col"
                      className="relative text-left py-3 px-3 font-semibold text-gray-900 min-w-[12rem] align-top bg-slate-50 print:bg-white border-l border-gray-100"
                    >
                      {onRemovePlan && plans.length > 2 && (
                        <button
                          type="button"
                          onClick={() => onRemovePlan(`${p.contract_id}-${p.plan_id}-${p.segment_id}`)}
                          className="life-compare-no-print absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          aria-label={`Remove ${p.name} from comparison`}
                          title="Remove from comparison"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                      <div className="leading-snug text-blue-900">{p.name}</div>
                      <div className="text-xs font-normal text-gray-600 mt-1">
                        Medicare Advantage and drug monthly premium
                      </div>
                      <div className="text-lg font-bold text-blue-700 mt-1">
                        {formatCurrency(p.partc_premium + p.partd_premium)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{p.organization_name}</div>
                      {p.url && (
                        <div className="mt-2 flex flex-col gap-1.5 life-compare-no-print">
                          <a
                            href={p.url.startsWith("http") ? p.url : `https://${p.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-blue-600 hover:underline"
                          >
                            Plan details →
                          </a>
                          <a
                            href={p.url.startsWith("http") ? p.url : `https://${p.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            View additional benefits
                          </a>
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Section: Overview */}
                <tr
                  className="bg-slate-100 cursor-pointer select-none hover:bg-slate-200/70 transition-colors print:bg-slate-100"
                  onClick={() => toggleSection("overview")}
                  role="button"
                  aria-expanded={expandedSections.overview}
                >
                  <td
                    colSpan={plans.length + 1}
                    className="compare-sticky-col sticky left-0 py-2 px-1 font-bold text-gray-800 print:static"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <ChevronIcon expanded={expandedSections.overview} />
                      Overview
                    </span>
                  </td>
                </tr>
                {expandedSections.overview && overviewRows.map((row) => {
                  const diff = rowValuesDiffer(row.values);
                  return (
                    <tr
                      key={row.label}
                      className={`border-b border-gray-100 align-top ${diff ? "bg-amber-50/40" : ""}`}
                    >
                      <th
                        scope="row"
                        className="compare-sticky-col text-left py-2 pr-3 pl-1 text-gray-600 font-medium border-r border-gray-100/90 bg-white/90 sticky left-0 z-[1] w-[11rem] min-w-[11rem] shadow-[2px_0_0_0_rgba(0,0,0,0.04)] print:static print:shadow-none"
                      >
                        {row.label}
                      </th>
                      {row.rich
                        ? row.rich.map((node, ci) => (
                            <td key={ci} className="py-2 px-3 text-gray-800 border-l border-gray-50">
                              {node}
                            </td>
                          ))
                        : row.values.map((v, ci) => (
                            <td
                              key={ci}
                              className={`py-2 px-3 text-gray-800 border-l border-gray-50 ${
                                cellIsMinorityValue(row.values, ci)
                                  ? "bg-amber-200/50 font-medium"
                                  : ""
                              }`}
                            >
                              {v}
                            </td>
                          ))}
                    </tr>
                  );
                })}

                {/* Section: Plan features */}
                <tr
                  className="bg-slate-100 cursor-pointer select-none hover:bg-slate-200/70 transition-colors print:bg-slate-100"
                  onClick={() => toggleSection("planFeatures")}
                  role="button"
                  aria-expanded={expandedSections.planFeatures}
                >
                  <td
                    colSpan={plans.length + 1}
                    className="compare-sticky-col sticky left-0 py-2 px-1 font-bold text-gray-800 print:static"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <ChevronIcon expanded={expandedSections.planFeatures} />
                      Plan features
                    </span>
                  </td>
                </tr>
                {expandedSections.planFeatures && planFeatureRows.map((row) => {
                  const strVals = row.values.map((b) => (b ? "Yes" : "No"));
                  const diff = rowValuesDiffer(strVals);
                  return (
                    <tr
                      key={row.label}
                      className={`border-b border-gray-100 ${diff ? "bg-amber-50/40" : ""}`}
                    >
                      <th
                        scope="row"
                        className="compare-sticky-col text-left py-2 pr-3 pl-1 text-gray-600 font-medium sticky left-0 bg-white/90 z-[1] border-r border-gray-100 print:static"
                      >
                        {row.label}
                      </th>
                      {row.values.map((b, ci) => (
                        <td
                          key={ci}
                          className={`py-2 px-3 text-center border-l border-gray-50 ${
                            cellIsMinorityValue(strVals, ci) ? "bg-amber-200/50" : ""
                          }`}
                        >
                          {boolMark(b)}
                        </td>
                      ))}
                    </tr>
                  );
                })}

                {/* Section: Benefits & costs */}
                {benefitRows.length > 0 && (
                  <>
                    <tr
                      className="bg-slate-100 cursor-pointer select-none hover:bg-slate-200/70 transition-colors print:bg-slate-100"
                      onClick={() => toggleSection("benefitsCosts")}
                      role="button"
                      aria-expanded={expandedSections.benefitsCosts}
                    >
                      <td
                        colSpan={plans.length + 1}
                        className="compare-sticky-col sticky left-0 py-2 px-1 font-bold text-gray-800 print:static"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <ChevronIcon expanded={expandedSections.benefitsCosts} />
                          Benefits &amp; costs (from plan detail)
                        </span>
                      </td>
                    </tr>
                    {expandedSections.benefitsCosts && benefitRows.map((row) => {
                      const diff = rowValuesDiffer(row.values);
                      return (
                        <tr
                          key={row.label}
                          className={`border-b border-gray-100 align-top ${diff ? "bg-amber-50/40" : ""}`}
                        >
                          <th
                            scope="row"
                            className="compare-sticky-col text-left py-2 pr-3 pl-1 text-gray-600 font-medium sticky left-0 bg-white/90 z-[1] border-r print:static"
                          >
                            {row.label}
                          </th>
                          {row.values.map((v, ci) => (
                            <td
                              key={ci}
                              className={`py-2 px-3 text-gray-800 text-xs leading-snug border-l whitespace-pre-wrap ${
                                cellIsMinorityValue(row.values, ci)
                                  ? "bg-amber-200/50 font-medium"
                                  : ""
                              }`}
                            >
                              {v}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </>
                )}

                {/* Section: Extra benefits */}
                <tr
                  className="bg-slate-100 cursor-pointer select-none hover:bg-slate-200/70 transition-colors print:bg-slate-100"
                  onClick={() => toggleSection("extraBenefits")}
                  role="button"
                  aria-expanded={expandedSections.extraBenefits}
                >
                  <td
                    colSpan={plans.length + 1}
                    className="compare-sticky-col sticky left-0 py-2 px-1 font-bold text-gray-800 print:static"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <ChevronIcon expanded={expandedSections.extraBenefits} />
                      Extra benefits (detail)
                    </span>
                  </td>
                </tr>
                {expandedSections.extraBenefits && (extraTableKeys.length > 0
                  ? extraTableKeys.map((composite) => {
                      const [section, label] = composite.split("|||");
                      const rowLabel = `${section}: ${label}`;
                      const values = structuredExtras.map((rows) => {
                        const hit = rows.find(
                          (r) => `${r.section}|||${r.label}` === composite
                        );
                        return hit?.text ?? "—";
                      });
                      const diff = rowValuesDiffer(values);
                      return (
                        <tr
                          key={composite}
                          className={`border-b border-gray-100 align-top ${diff ? "bg-amber-50/40" : ""}`}
                        >
                          <th
                            scope="row"
                            className="compare-sticky-col text-left py-2 pr-3 pl-1 text-gray-600 font-medium sticky left-0 bg-white/90 z-[1] print:static"
                          >
                            {rowLabel}
                          </th>
                          {values.map((v, ci) => (
                            <td
                              key={ci}
                              className={`py-2 px-3 text-xs text-gray-800 border-l leading-snug whitespace-pre-wrap ${
                                cellIsMinorityValue(values, ci) ? "bg-amber-200/50" : ""
                              }`}
                            >
                              {v}
                            </td>
                          ))}
                        </tr>
                      );
                    })
                  : (() => {
                      const maxExtra = Math.max(
                        ...planDetails.map((d) => extractExtraSections(d).length),
                        0
                      );
                      if (maxExtra === 0) {
                        return (
                          <tr className="border-b border-gray-100">
                            <th
                              scope="row"
                              className="compare-sticky-col text-left py-2 pl-1 text-gray-500 sticky left-0 bg-white print:static"
                            >
                              Dental / vision / hearing extras
                            </th>
                            {plans.map((p) => (
                              <td key={p.id} className="py-2 px-3 text-gray-500 text-xs border-l">
                                —
                              </td>
                            ))}
                          </tr>
                        );
                      }
                      const rowsOut: ReactNode[] = [];
                      for (let i = 0; i < maxExtra; i++) {
                        const label =
                          planDetails
                            .map((d) => extractExtraSections(d)[i]?.title)
                            .find(Boolean) ?? `Extra ${i + 1}`;
                        const values = planDetails.map(
                          (d) => extractExtraSections(d)[i]?.text ?? "—"
                        );
                        const diff = rowValuesDiffer(values);
                        rowsOut.push(
                          <tr
                            key={`extra-fallback-${i}`}
                            className={`border-b border-gray-100 align-top ${diff ? "bg-amber-50/40" : ""}`}
                          >
                            <th
                              scope="row"
                              className="compare-sticky-col text-left py-2 pr-3 pl-1 text-gray-600 font-medium sticky left-0 bg-white/90 z-[1] print:static"
                            >
                              {label}
                            </th>
                            {values.map((v, ci) => (
                              <td
                                key={ci}
                                className={`py-2 px-3 text-xs text-gray-800 border-l leading-snug whitespace-pre-wrap ${
                                  cellIsMinorityValue(values, ci) ? "bg-amber-200/50" : ""
                                }`}
                              >
                                {v}
                              </td>
                            ))}
                          </tr>
                        );
                      }
                      return rowsOut;
                    })())}

                {/* Section: Drug coverage & costs */}
                <tr
                  className="bg-slate-100 cursor-pointer select-none hover:bg-slate-200/70 transition-colors print:bg-slate-100"
                  onClick={() => toggleSection("drugCoverage")}
                  role="button"
                  aria-expanded={expandedSections.drugCoverage}
                >
                  <td
                    colSpan={plans.length + 1}
                    className="compare-sticky-col sticky left-0 py-2 px-1 font-bold text-gray-800 print:static"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <ChevronIcon expanded={expandedSections.drugCoverage} />
                      Drug coverage &amp; costs
                    </span>
                  </td>
                </tr>
                {expandedSections.drugCoverage && (
                  <>
                    {/* Drug coverage status (per entered drug) */}
                    {drugNames.length > 0 && (
                      <tr className="border-b border-gray-100 align-top">
                        <th
                          scope="row"
                          className="compare-sticky-col text-left py-2 pr-3 pl-1 text-gray-600 font-medium sticky left-0 bg-white/90 z-[1] border-r print:static"
                        >
                          Drugs covered
                        </th>
                        {drugCoveragePerPlan.map((rows, ci) => (
                          <td key={ci} className="py-2 px-3 border-l">
                            <DrugCoverageList rows={rows} />
                          </td>
                        ))}
                      </tr>
                    )}

                    {/* Per-pharmacy cost table */}
                    <tr className="border-b border-gray-100 align-top">
                      <th
                        scope="row"
                        className="compare-sticky-col text-left py-2 pr-3 pl-1 text-gray-600 font-medium sticky left-0 bg-white/90 z-[1] border-r print:static align-top"
                      >
                        <div>Drug &amp; premium costs by pharmacy</div>
                        <p className="mt-1 text-[10px] font-normal text-gray-400 leading-snug max-w-[11rem]">
                          You included drugs and pharmacies; this table uses both plan-search and plan-detail payloads.
                          If a cell is still “—”, Medicare did not return per-pharmacy rows for that specific plan.
                        </p>
                      </th>
                      {pharmacyCostTables.map((rows, ci) => {
                        const costStrings = pharmacyCostTables.map((r) =>
                          r.map((x) => x.estimatedAnnualCost.toFixed(2)).join(",")
                        );
                        return (
                          <td
                            key={ci}
                            className={`py-2 px-3 border-l ${
                              cellIsMinorityValue(costStrings, ci) ? "bg-amber-200/50" : ""
                            }`}
                          >
                            <PharmacyCostMiniTable rows={rows} />
                          </td>
                        );
                      })}
                    </tr>

                    {/* Existing text summary fallback */}
                    <tr className="border-b border-gray-100 align-top">
                      <th
                        scope="row"
                        className="compare-sticky-col text-left py-2 pr-3 pl-1 text-gray-600 font-medium sticky left-0 bg-white/90 print:static"
                      >
                        Pharmacy estimates &amp; drug summary
                      </th>
                      {drugColumnTexts.map((t, ci) => (
                        <td
                          key={ci}
                          className={`py-2 px-3 text-xs text-gray-800 border-l leading-snug whitespace-pre-wrap ${
                            cellIsMinorityValue(drugColumnTexts, ci) ? "bg-amber-200/50" : ""
                          }`}
                        >
                          {t}
                        </td>
                      ))}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
