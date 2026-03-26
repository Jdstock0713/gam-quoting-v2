"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Pharmacy, SelectedPharmacy, MAIL_ORDER_PHARMACY_NPI } from "@/types";
import { searchPharmacies } from "@/providers/quoteProvider";

const INITIAL_VISIBLE = 12;
const LOAD_MORE_INCREMENT = 12;
/** Total selections allowed, including mail order (Medicare.gov-style cap for drug pricing). */
const MAX_PHARMACY_SELECTIONS = 5;

function pharmacyToSelected(p: Pharmacy): SelectedPharmacy {
  return {
    npi: p.npi,
    name: p.name,
    street: p.street,
    city: p.city,
    state: p.state,
    zipcode: p.zipcode,
    distance_miles: Number.isFinite(p.distance_miles) ? p.distance_miles : null,
  };
}

const MAIL_ORDER_ENTRY: SelectedPharmacy = {
  npi: MAIL_ORDER_PHARMACY_NPI,
  name: "Mail order pharmacy",
  street: "",
  city: "",
  state: "",
  zipcode: "",
  distance_miles: null,
};

type Props = {
  zip: string;
  selectedPharmacies: SelectedPharmacy[];
  onSelectionChange: (pharmacies: SelectedPharmacy[]) => void;
};

export default function PharmacyPicker({
  zip,
  selectedPharmacies,
  onSelectionChange,
}: Props) {
  const [allPharmacies, setAllPharmacies] = useState<Pharmacy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  // Address-based search
  const [address, setAddress] = useState("");
  const [addressSearching, setAddressSearching] = useState(false);

  // Track which zip/address combo we last loaded for
  const loadedForRef = useRef<string>("");

  // Auto-load pharmacies on mount (by ZIP)
  const loadPharmacies = useCallback(
    async (searchAddress?: string) => {
      const key = `${zip}|${searchAddress ?? ""}`;
      // Don't reload if we already have results for this combo
      if (loadedForRef.current === key && allPharmacies.length > 0) return;

      if (searchAddress) {
        setAddressSearching(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        const results = await searchPharmacies(zip, searchAddress);
        setAllPharmacies(results);
        setVisibleCount(INITIAL_VISIBLE);
        loadedForRef.current = key;
        if (results.length === 0) {
          setError("No pharmacies found near this location.");
        }
      } catch {
        setError("Failed to load pharmacies. Please try again.");
        setAllPharmacies([]);
      } finally {
        setIsLoading(false);
        setAddressSearching(false);
      }
    },
    [zip, allPharmacies.length]
  );

  // Auto-load on mount
  useEffect(() => {
    loadPharmacies();
  }, [zip]); // eslint-disable-line react-hooks/exhaustive-deps

  function togglePharmacy(npi: string) {
    if (selectedPharmacies.some((p) => p.npi === npi)) {
      onSelectionChange(selectedPharmacies.filter((p) => p.npi !== npi));
      return;
    }
    if (selectedPharmacies.length >= MAX_PHARMACY_SELECTIONS) return;
    if (npi === MAIL_ORDER_PHARMACY_NPI) {
      onSelectionChange([...selectedPharmacies, MAIL_ORDER_ENTRY]);
      return;
    }
    const row = allPharmacies.find((p) => p.npi === npi);
    if (!row) return;
    onSelectionChange([...selectedPharmacies, pharmacyToSelected(row)]);
  }

  function handleAddressSearch() {
    if (address.trim()) {
      loadPharmacies(address.trim());
    }
  }

  function handleAddressKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddressSearch();
    }
  }

  const mailOrderSelected = selectedPharmacies.some((p) => p.npi === MAIL_ORDER_PHARMACY_NPI);
  const atSelectionMax = selectedPharmacies.length >= MAX_PHARMACY_SELECTIONS;
  const mailOrderCheckboxDisabled = !mailOrderSelected && atSelectionMax;
  const visible = allPharmacies.slice(0, visibleCount);
  const hasMore = visibleCount < allPharmacies.length;

  // Progress bar percentage (fake progress for UX)
  const progressPercent = isLoading ? 70 : allPharmacies.length > 0 ? 100 : 0;

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Select your preferred pharmacies
      </label>
      <p className="text-xs text-gray-500 mb-3">
        Adding pharmacies helps find plans with the best drug pricing at your
        local stores. You can select up to {MAX_PHARMACY_SELECTIONS} pharmacies
        total, including mail order.
      </p>

      {/* Mail Order Pharmacy — always visible at the top */}
      <label
        className={`flex items-start gap-2 p-3 rounded-lg border mb-3 transition-colors ${
          mailOrderCheckboxDisabled ? "cursor-not-allowed opacity-60 bg-gray-50 border-gray-200" : "cursor-pointer"
        } ${
          mailOrderSelected
            ? "bg-blue-50 border-blue-300"
            : !mailOrderCheckboxDisabled && "bg-white border-gray-200 hover:bg-gray-50"
        }`}
      >
        <input
          type="checkbox"
          checked={mailOrderSelected}
          disabled={mailOrderCheckboxDisabled}
          onChange={() => togglePharmacy(MAIL_ORDER_PHARMACY_NPI)}
          title={mailOrderCheckboxDisabled ? `Select up to ${MAX_PHARMACY_SELECTIONS} pharmacies` : undefined}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 disabled:opacity-50"
        />
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
            Mail Order Pharmacy
            <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
              Delivered to your door
            </span>
          </div>
          <div className="text-xs text-gray-500">
            Get prescriptions delivered by mail — often lower cost for 90-day
            supplies
          </div>
        </div>
      </label>

      {/* Loading state with animated progress bar */}
      {isLoading && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-600">
              Loading pharmacies near {zip}...
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-1000 ease-out animate-pulse"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Optional address field */}
      {!isLoading && (
        <div className="mb-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              onKeyDown={handleAddressKeyDown}
              placeholder="Client address for nearby results (optional)"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={handleAddressSearch}
              disabled={!address.trim() || addressSearching}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {addressSearching ? "Searching..." : "Find Nearby"}
            </button>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Enter an address to sort pharmacies by distance from that location
          </p>
        </div>
      )}

      {/* Address search loading */}
      {addressSearching && (
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full animate-pulse" style={{ width: "60%" }} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Searching pharmacies near that address...
          </p>
        </div>
      )}

      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs mb-3">
          {error}
          <button
            onClick={() => loadPharmacies()}
            className="ml-2 text-red-700 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Pharmacy list */}
      {!isLoading && visible.length > 0 && (
        <>
          <div className="text-xs text-gray-500 mb-2 flex items-center justify-between">
            <span>
              Showing {visible.length} of {allPharmacies.length} pharmacies
            </span>
            {allPharmacies.length > 0 && (
              <span className="text-gray-400">
                Sorted by distance
              </span>
            )}
          </div>
          <div className="space-y-1 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-2">
            {visible.map((pharm) => {
              const rowSelected = selectedPharmacies.some((p) => p.npi === pharm.npi);
              const rowDisabled = !rowSelected && atSelectionMax;
              return (
              <label
                key={pharm.npi}
                className={`flex items-start gap-2 p-2 rounded transition-colors ${
                  rowDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-gray-50"
                } ${rowSelected ? "bg-blue-50" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={rowSelected}
                  disabled={rowDisabled}
                  onChange={() => togglePharmacy(pharm.npi)}
                  title={rowDisabled ? `Select up to ${MAX_PHARMACY_SELECTIONS} pharmacies` : undefined}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-0.5 disabled:opacity-50"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-800">
                    {pharm.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {pharm.street}, {pharm.city}, {pharm.state}{" "}
                    {pharm.zipcode?.slice(0, 5)}
                    {pharm.distance_miles != null &&
                      ` · ${pharm.distance_miles.toFixed(1)} mi`}
                  </div>
                </div>
              </label>
            );
            })}
          </div>

          {/* Load more button */}
          {hasMore && (
            <button
              onClick={() =>
                setVisibleCount((prev) =>
                  Math.min(prev + LOAD_MORE_INCREMENT, allPharmacies.length)
                )
              }
              className="mt-2 w-full text-center py-2 text-sm text-blue-600 hover:text-blue-800 font-medium bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Load more pharmacies ({allPharmacies.length - visibleCount}{" "}
              remaining)
            </button>
          )}
        </>
      )}

      {selectedPharmacies.length > 0 && (
        <p className="text-xs text-blue-600 mt-2 font-medium">
          {selectedPharmacies.length} of {MAX_PHARMACY_SELECTIONS} selected
          {mailOrderSelected && " (includes mail order)"}
        </p>
      )}
      {atSelectionMax && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 mt-2">
          Maximum reached. Deselect a pharmacy to add a different one.
        </p>
      )}
    </div>
  );
}
