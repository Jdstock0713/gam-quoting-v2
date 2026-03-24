"use client";

import { Quote } from "@/types";

type Props = {
  quotes: Quote[];
  onClear: () => void;
};

export default function ComparisonView({ quotes, onClear }: Props) {
  if (quotes.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Compare ({quotes.length})
        </h2>
        <button
          onClick={onClear}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Clear Selection
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 pr-4 font-medium text-gray-600">
                Carrier
              </th>
              <th className="text-left py-2 pr-4 font-medium text-gray-600">
                Plan
              </th>
              <th className="text-left py-2 pr-4 font-medium text-gray-600">
                Rate Type
              </th>
              <th className="text-right py-2 font-medium text-gray-600">
                Monthly Premium
              </th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id} className="border-b border-gray-100">
                <td className="py-2 pr-4 font-medium text-gray-800">
                  {q.carrier}
                </td>
                <td className="py-2 pr-4 text-gray-600">Plan {q.plan}</td>
                <td className="py-2 pr-4 text-gray-600">{q.rateType}</td>
                <td className="py-2 text-right font-semibold text-blue-600 whitespace-nowrap">
                  ${q.premium.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
