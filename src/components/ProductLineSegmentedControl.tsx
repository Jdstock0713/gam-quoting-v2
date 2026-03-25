"use client";

import { ProductLine } from "@/types";

type Props = {
  productLine: ProductLine;
  onChange: (line: ProductLine) => void;
  className?: string;
};

/** Pill segmented control (neutral grays) — sliding white indicator over a gray track. */
export default function ProductLineSegmentedControl({
  productLine,
  onChange,
  className = "",
}: Props) {
  return (
    <div
      className={`relative flex w-full rounded-full bg-gray-200 p-1 shadow-inner ${className}`}
      role="tablist"
      aria-label="Product line"
    >
      <div
        className="pointer-events-none absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full bg-white shadow-sm ring-1 ring-gray-200/80 transition-[left] duration-200 ease-out"
        style={{
          left: productLine === "medicare" ? "4px" : "calc(50%)",
        }}
        aria-hidden
      />
      <button
        type="button"
        role="tab"
        aria-selected={productLine === "medicare"}
        className={`relative z-10 flex-1 rounded-full py-2 px-3 text-sm font-semibold transition-colors sm:px-4 ${
          productLine === "medicare"
            ? "text-gray-800"
            : "text-gray-500 hover:text-gray-600"
        }`}
        onClick={() => onChange("medicare")}
      >
        Medicare
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={productLine === "life"}
        className={`relative z-10 flex-1 rounded-full py-2 px-3 text-sm font-semibold transition-colors sm:px-4 ${
          productLine === "life"
            ? "text-gray-800"
            : "text-gray-500 hover:text-gray-600"
        }`}
        onClick={() => onChange("life")}
      >
        Life Insurance
      </button>
    </div>
  );
}
