"use client";

import { useEffect, useCallback, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import type { LifeQuoteRequest, LifeQuoteResult, LifeIssueType } from "@/types";
import {
  formatLifeFaceAmountDisplay,
  getLifeInsuranceCategoryLabel,
  getLifeQuotedHealthLabel,
} from "./LifeInsuranceForm";
import { getPremiumDisplayLines } from "@/lib/lifePremiumDisplay";

/** Frozen quote + request as of when the user added it to compare */
export type LifeCompareColumn = {
  result: LifeQuoteResult;
  request: LifeQuoteRequest;
  isFinalExpense: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** Each column is a snapshot — not updated when new quotes load */
  columns: LifeCompareColumn[];
  formatDollar: (val: string | null) => string;
};

function issueTypeLabel(t: LifeIssueType): string {
  if (t === "gi") return "Guaranteed Issue";
  if (t === "si") return "Simplified Issue";
  if (t === "underwritten") return "Fully underwritten";
  return "—";
}

function formatDob(r: LifeQuoteRequest): string {
  const mo = r.birthMonth.padStart(2, "0");
  const d = r.birthDay.padStart(2, "0");
  return `${mo}/${d}/${r.birthYear}`;
}

/** Subtitle under carrier name: health · product type · coverage */
function columnHeaderSubtitle(col: LifeCompareColumn): string {
  const h = getLifeQuotedHealthLabel(col.request.health);
  const cat = getLifeInsuranceCategoryLabel(col.request.category);
  const face = formatLifeFaceAmountDisplay(col.request.faceAmount);
  return `${h} · ${cat} · ${face}`;
}

function rowValuesDiffer(values: string[]): boolean {
  return new Set(values).size > 1;
}

/** Highlight cells whose value appears fewer times than the mode (ties: no cell highlight). */
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

export default function LifeCompareModal({
  open,
  onClose,
  columns,
  formatDollar,
}: Props) {
  const [mounted, setMounted] = useState(false);

  const handlePrint = useCallback(() => {
    window.print();
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

  const rows = useMemo(() => {
    const results = columns.map((c) => c.result);

    const base: { label: string; values: string[] }[] = [
      {
        label: "Carrier",
        values: results.map((r) => r.company || "—"),
      },
      {
        label: "Product",
        values: results.map((r) => r.product.trim() || "—"),
      },
      {
        label: "Coverage amount (when selected)",
        values: columns.map((c) =>
          formatLifeFaceAmountDisplay(c.request.faceAmount)
        ),
      },
      {
        label: "Insurance type (when selected)",
        values: columns.map((c) =>
          getLifeInsuranceCategoryLabel(c.request.category)
        ),
      },
      {
        label: "Product / pay structure",
        values: results.map((r) => r.categoryTitle?.trim() || "—"),
      },
      {
        label: "Premium (summary)",
        values: results.map((r) => {
          const lines = getPremiumDisplayLines(r, formatDollar);
          const parts = [lines.primary];
          if (lines.primarySub) parts.push(lines.primarySub);
          if (lines.secondary) parts.push(lines.secondary);
          return parts.join(" · ");
        }),
      },
      {
        label: "Annual premium",
        values: results.map((r) => formatDollar(r.premiumAnnual)),
      },
      {
        label: "Monthly premium",
        values: results.map((r) =>
          r.premiumMonthly ? formatDollar(r.premiumMonthly) : "—"
        ),
      },
      {
        label: "Quarterly premium",
        values: results.map((r) =>
          r.premiumQuarterly ? formatDollar(r.premiumQuarterly) : "—"
        ),
      },
      {
        label: "Semi-annual premium",
        values: results.map((r) =>
          r.premiumSemiAnnual ? formatDollar(r.premiumSemiAnnual) : "—"
        ),
      },
      {
        label: "Health class (rate)",
        values: results.map((r) => r.healthClass?.trim() || "—"),
      },
      {
        label: "AM Best (financial strength)",
        values: results.map((r) => {
          const id = r.amBestId?.trim();
          const amb = r.amBest?.trim();
          if (id && amb && id !== amb) return `${id} (${amb})`;
          return id || amb || "—";
        }),
      },
    ];

    if (columns.some((c) => c.isFinalExpense)) {
      base.push({
        label: "Issue type (detected)",
        values: columns.map((c) =>
          c.isFinalExpense ? issueTypeLabel(c.result.issueType) : "—"
        ),
      });
    }

    base.push(
      {
        label: "Quoted health class (when selected)",
        values: columns.map((c) => getLifeQuotedHealthLabel(c.request.health)),
      },
      {
        label: "Gender (when selected)",
        values: columns.map((c) =>
          c.request.gender === "M" ? "Male" : "Female"
        ),
      },
      {
        label: "Tobacco (when selected)",
        values: columns.map((c) =>
          c.request.smoker === "Y" ? "Yes" : "No"
        ),
      },
      {
        label: "Date of birth (when selected)",
        values: columns.map((c) => formatDob(c.request)),
      },
    );

    return base;
  }, [columns, formatDollar]);

  if (!mounted || !open) return null;

  const modal = (
    <div
      className="life-compare-portal fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 print:bg-white print:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="life-compare-title"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 print:shadow-none print:border-0 print:max-w-none print:max-h-none">
        <div className="life-compare-no-print flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-200 bg-gray-50">
          <h2
            id="life-compare-title"
            className="text-lg font-bold text-gray-900"
          >
            Compare life insurance quotes
          </h2>
          <div className="flex items-center gap-2 flex-wrap justify-end">
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
              className="px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
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
            Each column reflects the quote and inputs as they were when you
            added it to compare. Rows with differences are shaded; differing
            values in a row are highlighted when one value is the clear majority.
            Data from the Compulife API (
            <a
              href="https://docs.compulife.com/"
              className="text-emerald-700 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              docs.compulife.com
            </a>
            ). Verify before placing business.
          </p>
          <div className="overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0">
            <table className="compare-print-table w-full min-w-[720px] text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th
                    scope="col"
                    className="compare-sticky-col sticky left-0 z-[2] text-left py-2 pr-3 pl-1 font-semibold text-gray-700 bg-gray-50 w-[11rem] min-w-[11rem] max-w-[13rem] align-top shadow-[2px_0_0_0_rgba(0,0,0,0.04)] print:bg-white print:static print:shadow-none print:w-auto"
                  >
                    Detail
                  </th>
                  {columns.map((col, i) => (
                    <th
                      key={i}
                      scope="col"
                      className="text-left py-2 px-3 font-semibold text-gray-900 min-w-[11rem] align-top bg-gray-50 print:bg-white"
                    >
                      <div className="leading-snug">{col.result.company}</div>
                      <div
                        className="text-xs font-normal text-gray-500 mt-1 leading-snug"
                        title={columnHeaderSubtitle(col)}
                      >
                        {columnHeaderSubtitle(col)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const diff = rowValuesDiffer(row.values);
                  const labelBg = diff
                    ? "bg-amber-50/70"
                    : "bg-white";
                  return (
                    <tr
                      key={row.label}
                      className={`border-b border-gray-100 align-top ${
                        diff ? "bg-amber-50/35" : ""
                      }`}
                    >
                      <th
                        scope="row"
                        className={`compare-sticky-col text-left py-2 pr-3 pl-1 text-gray-600 font-medium border-r border-gray-100/90 ${labelBg} sticky left-0 z-[1] w-[11rem] min-w-[11rem] max-w-[13rem] shadow-[2px_0_0_0_rgba(0,0,0,0.04)] print:static print:border-r-0 print:shadow-none print:w-auto`}
                      >
                        {row.label}
                      </th>
                      {row.values.map((v, ci) => (
                        <td
                          key={ci}
                          className={`py-2 px-3 text-gray-800 ${
                            cellIsMinorityValue(row.values, ci)
                              ? "bg-amber-200/60 font-medium"
                              : ""
                          }`}
                        >
                          {v}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
