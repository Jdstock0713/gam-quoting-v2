"use client";

type Props = {
  allCarriers: string[];
  selectedCarriers: Set<string>;
  onToggleCarrier: (carrier: string) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
};

export default function CarrierSettings({
  allCarriers,
  selectedCarriers,
  onToggleCarrier,
  onSelectAll,
  onClearAll,
}: Props) {
  if (allCarriers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Carrier Preferences
        </h2>
        <p className="text-sm text-gray-500">
          Submit a quote to see available carriers.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-3">
        Carrier Preferences
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Choose which carriers to include in results.
      </p>
      <div className="flex gap-2 mb-3">
        <button
          onClick={onSelectAll}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Select All
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={onClearAll}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
        >
          Clear All
        </button>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {allCarriers.map((carrier) => (
          <label
            key={carrier}
            className="flex items-center gap-2 cursor-pointer py-1"
          >
            <input
              type="checkbox"
              checked={selectedCarriers.has(carrier)}
              onChange={() => onToggleCarrier(carrier)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{carrier}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
