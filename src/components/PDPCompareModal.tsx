"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { PDPPlan, PDPPlanDetail, PharmacyCostRow, DrugCoverageRow } from "@/types";
import { extractPharmacyBreakdownFromPlan, extractPharmacyCostTable } from "@/lib/maPlanDetailParse";
import {
  extractDrugFormulary,
  extractPDPDrugSection,
  extractPharmacyDetails,
  extractPDPDrugCoverageStatus,
} from "@/lib/pdpPlanDetailParse";

type Props = {
  open: boolean;
  onClose: () => void;
  plans: PDPPlan[];
  planDetails: PDPPlanDetail[];
  zip: string;
  drugCount?: number;
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

function buildEnrollUrl(plan: PDPPlan): string {
  return `https://www.medicare.gov/plan-compare/#/enroll?plan_id=${plan.contract_id}-${plan.plan_id}-${plan.segment_id}&year=${plan.contract_year}&lang=en`;
}

export default function PDPCompareModal({
  open,
  onClose,
  plans,
  planDetails,
  zip,
  drugCount = 0,
  drugNames = [],
  onRemovePlan,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    drugCoverage: true,
    tierDetails: true,
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
      label: "Total monthly premium (drug plan only)",
      values: plans.map((p) => formatCurrency(p.partd_premium)),
    });

    rows.push({
      label: "Yearly drug deductible",
      values: plans.map((p) => formatCurrency(p.drug_plan_deductible)),
    });

    return rows;
  }, [plans]);

  const drugCoverageRows = useMemo(() => {
    const hasDrugs = drugCount > 0;
    if (!hasDrugs) {
      return [
        {
          label: "Prescription drugs",
          values: plans.map(() => "Add your prescription drugs in the wizard for coverage estimates."),
        },
      ];
    }
    return [
      {
        label: "Drugs in comparison",
        values: plans.map(() => `${drugCount} drug(s) entered — coverage counts depend on plan formulary; confirm on carrier or Medicare.gov.`),
      },
    ];
  }, [plans, drugCount]);

  const pharmacyDrugTexts = useMemo(
    () =>
      plans.map((plan, i) => {
        const d = planDetails[i];
        const pharmacy = extractPharmacyBreakdownFromPlan(plan);
        const fromDetail = d ? extractPDPDrugSection(d) : "";
        const parts = [pharmacy, fromDetail].filter(Boolean);
        if (!parts.length) {
          return drugCount > 0
            ? "No per-pharmacy breakdown in search response — see aggregate cost on the plan card or Medicare.gov."
            : "Add drugs and pharmacies for estimated total drug + premium cost.";
        }
        return parts.join("\n\n");
      }),
    [plans, planDetails, drugCount]
  );

  const tierSummaryTexts = useMemo(
    () =>
      planDetails.map((d) => {
        const f = extractDrugFormulary(d);
        const lines: string[] = [];
        if (f.tieredCosts?.length) {
          lines.push(
            f.tieredCosts.map((t) => `${t.tier}: ${t.cost}`).join("\n")
          );
        }
        if (f.gapCoverage) lines.push(`Gap: ${f.gapCoverage}`);
        if (f.catastrophicCoverage) lines.push(`Catastrophic: ${f.catastrophicCoverage}`);
        const ph = extractPharmacyDetails(d);
        if (ph.mailOrder90Day === true) lines.push("Mail order (90-day): Yes");
        if (ph.preferredPharmacyNetwork === true) lines.push("Preferred pharmacy network: Yes");
        return lines.length ? lines.join("\n") : "—";
      }),
    [planDetails]
  );

  const pharmacyCostTables = useMemo(
    () => plans.map((plan) => extractPharmacyCostTable(plan)),
    [plans]
  );

  const drugCoveragePerPlan = useMemo(
    () => planDetails.map((d) => extractPDPDrugCoverageStatus(d, drugNames)),
    [planDetails, drugNames]
  );

  if (!mounted || !open || plans.length === 0) return null;

  const modal = (
    <div
      className="life-compare-portal fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/50 print:bg-white print:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdp-compare-title"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-[100rem] w-full max-h-[95vh] flex flex-col overflow-hidden border border-gray-200 print:shadow-none print:border-0 print:max-w-none print:max-h-none">
        <div className="life-compare-no-print flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 bg-slate-50">
          <h2 id="pdp-compare-title" className="text-lg font-bold text-gray-900">
            Compare Part D prescription drug plans
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
            ZIP {zip}. Verify details on{" "}
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
            <table className="compare-print-table w-full min-w-[640px] text-sm border-collapse">
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
                      <div className="text-xs font-normal text-gray-600 mt-1">Monthly premium</div>
                      <div className="text-lg font-bold text-blue-700 mt-1">
                        {formatCurrency(p.partd_premium)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{p.organization_name}</div>
                      <div className="text-xs text-gray-500 mt-0.5 font-mono">
                        Plan ID: {p.contract_id}-{p.plan_id}-{p.segment_id}
                      </div>
                      <div className="mt-2 flex flex-col gap-1.5 life-compare-no-print">
                        <a
                          href={buildEnrollUrl(p)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-center w-full px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors"
                        >
                          Enroll
                        </a>
                        {p.url && (
                          <>
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
                              View formulary / costs
                            </a>
                          </>
                        )}
                      </div>
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
                    {/* Drug coverage status */}
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
                        className="compare-sticky-col text-left py-2 pr-3 pl-1 text-gray-600 font-medium sticky left-0 bg-white/90 z-[1] border-r print:static"
                      >
                        Drug &amp; premium costs by pharmacy
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

                    {drugCoverageRows.map((row) => {
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
                              className={`py-2 px-3 text-xs text-gray-800 border-l leading-snug whitespace-pre-wrap ${
                                cellIsMinorityValue(row.values, ci) ? "bg-amber-200/50" : ""
                              }`}
                            >
                              {v}
                            </td>
                          ))}
                        </tr>
                      );
                    })}

                    <tr className="border-b border-gray-100 align-top">
                      <th
                        scope="row"
                        className="compare-sticky-col text-left py-2 pr-3 pl-1 text-gray-600 font-medium sticky left-0 bg-white/90 print:static"
                      >
                        Estimated drug + premium (by pharmacy / detail)
                      </th>
                      {pharmacyDrugTexts.map((t, ci) => (
                        <td
                          key={ci}
                          className={`py-2 px-3 text-xs text-gray-800 border-l leading-snug whitespace-pre-wrap ${
                            cellIsMinorityValue(pharmacyDrugTexts, ci) ? "bg-amber-200/50" : ""
                          }`}
                        >
                          {t}
                        </td>
                      ))}
                    </tr>
                  </>
                )}

                {/* Section: Tier & pharmacy details */}
                <tr
                  className="bg-slate-100 cursor-pointer select-none hover:bg-slate-200/70 transition-colors print:bg-slate-100"
                  onClick={() => toggleSection("tierDetails")}
                  role="button"
                  aria-expanded={expandedSections.tierDetails}
                >
                  <td
                    colSpan={plans.length + 1}
                    className="compare-sticky-col sticky left-0 py-2 px-1 font-bold text-gray-800 print:static"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <ChevronIcon expanded={expandedSections.tierDetails} />
                      Tiers, gap &amp; pharmacy details
                    </span>
                  </td>
                </tr>
                {expandedSections.tierDetails && (
                  <tr className="border-b border-gray-100 align-top">
                    <th
                      scope="row"
                      className="compare-sticky-col text-left py-2 pr-3 pl-1 text-gray-600 font-medium sticky left-0 bg-white/90 print:static"
                    >
                      Tiers, gap &amp; pharmacy (plan detail)
                    </th>
                    {tierSummaryTexts.map((t, ci) => (
                      <td
                        key={ci}
                        className={`py-2 px-3 text-xs text-gray-800 border-l leading-snug whitespace-pre-wrap ${
                          cellIsMinorityValue(tierSummaryTexts, ci) ? "bg-amber-200/50" : ""
                        }`}
                      >
                        {t}
                      </td>
                    ))}
                  </tr>
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
