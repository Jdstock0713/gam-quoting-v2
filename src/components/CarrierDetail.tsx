"use client";

import { CarrierInfo } from "@/data/carrierData";

type Props = {
  data: CarrierInfo;
};

function formatCurrency(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function formatLives(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

function ratingColor(rating: string): string {
  if (rating.startsWith("A++")) return "text-green-700 bg-green-100";
  if (rating.startsWith("A+")) return "text-green-700 bg-green-100";
  if (rating.startsWith("A")) return "text-blue-700 bg-blue-100";
  if (rating.startsWith("B")) return "text-yellow-700 bg-yellow-100";
  return "text-gray-600 bg-gray-100";
}

function lossRatioColor(ratio: number): string {
  if (ratio > 100) return "text-red-600";
  if (ratio > 90) return "text-orange-600";
  if (ratio > 80) return "text-yellow-600";
  return "text-green-600";
}

export default function CarrierDetail({ data }: Props) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-200 space-y-3 text-sm">
      {/* Financial Strength */}
      <div>
        <h4 className="font-medium text-gray-700 mb-1.5">
          Financial Strength
        </h4>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${ratingColor(data.amBestRating)}`}
          >
            AM Best: {data.amBestRating}
          </span>
          {data.amBestOutlook && (
            <span className="text-xs text-gray-500">
              Outlook: {data.amBestOutlook}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Parent: {data.parentCompany}
        </p>
      </div>

      {/* NAIC Market Data */}
      {data.naicPremiumsEarned && (
        <div>
          <h4 className="font-medium text-gray-700 mb-1.5">
            2024 Market Data{" "}
            <span className="font-normal text-gray-400">(NAIC)</span>
          </h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Premium Volume:</span>
              <span className="font-medium text-gray-800">
                {formatCurrency(data.naicPremiumsEarned)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Lives Covered:</span>
              <span className="font-medium text-gray-800">
                {formatLives(data.naicLivesCovered ?? 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Loss Ratio:</span>
              <span
                className={`font-medium ${lossRatioColor(data.naicLossRatio ?? 0)}`}
              >
                {data.naicLossRatio?.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Market Share:</span>
              <span className="font-medium text-gray-800">
                {data.naicMarketShare?.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Loss ratio insight */}
          {data.naicLossRatio && (
            <p className="text-xs text-gray-500 mt-2 italic">
              {data.naicLossRatio > 100
                ? "Loss ratio >100% means claims exceed premiums — rate increases are highly likely."
                : data.naicLossRatio > 90
                  ? "Loss ratio >90% may signal upcoming rate increases."
                  : data.naicLossRatio > 80
                    ? "Loss ratio is within a healthy range for Medicare Supplement."
                    : "Low loss ratio suggests strong profitability and stable pricing."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
