"use client";

import { useState } from "react";
import { Quote } from "@/types";
import QuoteCard from "./QuoteCard";

const ITEMS_PER_PAGE = 10;

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
  const [currentPage, setCurrentPage] = useState(0);

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

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated = sorted.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Quotes ({quotes.length})
          {totalPages > 1 && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              — Page {currentPage + 1} of {totalPages}
            </span>
          )}
        </h2>
        <button
          onClick={() => {
            onToggleSort();
            setCurrentPage(0);
          }}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
        >
          Price {sortAscending ? "↑ Low to High" : "↓ High to Low"}
        </button>
      </div>
      <div className="grid gap-3">
        {paginated.map((quote) => (
          <QuoteCard
            key={quote.id}
            quote={quote}
            isSelected={selectedIds.has(quote.id)}
            onToggleSelect={onToggleSelect}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
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
    </div>
  );
}
