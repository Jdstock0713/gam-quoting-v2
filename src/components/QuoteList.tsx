"use client";

import { Quote } from "@/types";
import QuoteCard from "./QuoteCard";

type Props = {
  quotes: Quote[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onViewDetails: (quote: Quote) => void;
  sortAscending: boolean;
  onToggleSort: () => void;
};

export default function QuoteList({
  quotes,
  selectedIds,
  onToggleSelect,
  onViewDetails,
  sortAscending,
  onToggleSort,
}: Props) {
  if (quotes.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No quotes to display. Submit the form above to get quotes.
      </div>
    );
  }

  const sorted = [...quotes].sort((a, b) =>
    sortAscending ? a.premium - b.premium : b.premium - a.premium
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Quotes ({quotes.length})
        </h2>
        <button
          onClick={onToggleSort}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          Price {sortAscending ? "↑ Low to High" : "↓ High to Low"}
        </button>
      </div>
      <div className="grid gap-3">
        {sorted.map((quote) => (
          <QuoteCard
            key={quote.id}
            quote={quote}
            isSelected={selectedIds.has(quote.id)}
            onToggleSelect={onToggleSelect}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
}
