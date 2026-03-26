"use client";

import { useState } from "react";
import { Quote } from "@/types";
import { getCarrierData } from "@/data/carrierData";
import CarrierDetail from "./CarrierDetail";

type Props = {
  quote: Quote;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onViewDetails: (quote: Quote) => void;
};

export default function QuoteCard({
  quote,
  isSelected,
  onToggleSelect,
  onViewDetails,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const carrierInfo = getCarrierData(quote.carrier);

  return (
    <div
      className={`bg-white rounded-lg shadow p-4 border-2 transition-colors ${
        isSelected ? "border-blue-500" : "border-transparent"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-800 line-clamp-2 sm:line-clamp-none">{quote.carrier}</h3>
            {carrierInfo && (
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold ${
                  carrierInfo.amBestRating.startsWith("A")
                    ? "text-green-700 bg-green-100"
                    : carrierInfo.amBestRating.startsWith("B")
                      ? "text-yellow-700 bg-yellow-100"
                      : "text-gray-600 bg-gray-100"
                }`}
              >
                {carrierInfo.amBestRating}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Plan {quote.plan} &middot; {quote.rateType}
          </p>
          <div className="mt-2">
            <span className="text-2xl font-bold text-blue-600">
              ${quote.premium.toFixed(2)}
            </span>
            <span className="text-sm font-normal text-gray-500">/mo</span>
          </div>
        </div>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(quote.id)}
          className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
          title="Select for comparison"
        />
      </div>

      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={() => onViewDetails(quote)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium py-2 min-h-[44px] inline-flex items-center"
        >
          View Details
        </button>
        {carrierInfo && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 py-2 min-h-[44px]"
          >
            {expanded ? "Hide" : "Show"} Carrier Info
            <span className="text-xs">{expanded ? "▲" : "▼"}</span>
          </button>
        )}
      </div>

      {expanded && carrierInfo && <CarrierDetail data={carrierInfo} />}
    </div>
  );
}
