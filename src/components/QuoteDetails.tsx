"use client";

import { Quote } from "@/types";

type Props = {
  quote: Quote;
  onClose: () => void;
};

export default function QuoteDetails({ quote, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Quote Details
        </h2>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm text-gray-500">Carrier</dt>
            <dd className="font-medium text-gray-800">{quote.carrier}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Plan</dt>
            <dd className="font-medium text-gray-800">Plan {quote.plan}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Monthly Premium</dt>
            <dd className="text-2xl font-bold text-blue-600">
              ${quote.premium.toFixed(2)}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Rate Type</dt>
            <dd className="font-medium text-gray-800">{quote.rateType}</dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Phone</dt>
            <dd className="font-medium text-gray-800">
              <a href={`tel:${quote.phone}`} className="text-blue-600 hover:underline">
                {quote.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-gray-500">Website</dt>
            <dd className="font-medium text-gray-800">
              <a
                href={quote.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm break-all"
              >
                {quote.website}
              </a>
            </dd>
          </div>
        </dl>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-gray-100 text-gray-700 py-2 px-4 rounded font-medium hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
