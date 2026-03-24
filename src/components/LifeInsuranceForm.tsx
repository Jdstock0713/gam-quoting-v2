"use client";

import { useState } from "react";
import { LifeQuoteRequest } from "@/types";

const US_STATES = [
  { code: "1", name: "Alabama" }, { code: "2", name: "Alaska" },
  { code: "3", name: "Arizona" }, { code: "4", name: "Arkansas" },
  { code: "5", name: "California" }, { code: "6", name: "Colorado" },
  { code: "7", name: "Connecticut" }, { code: "8", name: "Delaware" },
  { code: "9", name: "Dist. Columbia" }, { code: "10", name: "Florida" },
  { code: "11", name: "Georgia" }, { code: "12", name: "Hawaii" },
  { code: "13", name: "Idaho" }, { code: "14", name: "Illinois" },
  { code: "15", name: "Indiana" }, { code: "16", name: "Iowa" },
  { code: "17", name: "Kansas" }, { code: "18", name: "Kentucky" },
  { code: "19", name: "Louisiana" }, { code: "20", name: "Maine" },
  { code: "21", name: "Maryland" }, { code: "22", name: "Massachusetts" },
  { code: "23", name: "Michigan" }, { code: "24", name: "Minnesota" },
  { code: "25", name: "Mississippi" }, { code: "26", name: "Missouri" },
  { code: "27", name: "Montana" }, { code: "28", name: "Nebraska" },
  { code: "29", name: "Nevada" }, { code: "30", name: "New Hampshire" },
  { code: "31", name: "New Jersey" }, { code: "32", name: "New Mexico" },
  { code: "52", name: "New York (Non-Business)" },
  { code: "33", name: "New York (Business)" },
  { code: "34", name: "North Carolina" }, { code: "35", name: "North Dakota" },
  { code: "36", name: "Ohio" }, { code: "37", name: "Oklahoma" },
  { code: "38", name: "Oregon" }, { code: "39", name: "Pennsylvania" },
  { code: "40", name: "Rhode Island" }, { code: "41", name: "South Carolina" },
  { code: "42", name: "South Dakota" }, { code: "43", name: "Tennessee" },
  { code: "44", name: "Texas" }, { code: "45", name: "Utah" },
  { code: "46", name: "Vermont" }, { code: "47", name: "Virginia" },
  { code: "48", name: "Washington" }, { code: "49", name: "West Virginia" },
  { code: "50", name: "Wisconsin" }, { code: "51", name: "Wyoming" },
];

const HEALTH_CLASSES = [
  { value: "PP", label: "Preferred Plus" },
  { value: "P", label: "Preferred" },
  { value: "RP", label: "Regular Plus" },
  { value: "R", label: "Regular" },
];

// Categories organized by underwriting type for broker-friendly navigation
// Note: Compulife's category codes map to product structure (term length, etc.)
// Whether a product is simplified issue vs. paramed depends on the carrier and face amount.
// We organize them in a way that helps brokers find what they need.
const PRODUCT_CATEGORY_GROUPS = [
  {
    label: "─── TERM LIFE (Fully Underwritten / Paramed) ───",
    description: "Standard term products — most carriers require paramed exam at higher face amounts",
    options: [
      { value: "3", label: "10 Year Level Term" },
      { value: "4", label: "15 Year Level Term" },
      { value: "5", label: "20 Year Level Term" },
      { value: "6", label: "25 Year Level Term" },
      { value: "7", label: "30 Year Level Term" },
      { value: "9", label: "35 Year Level Term" },
      { value: "0", label: "40 Year Level Term" },
      { value: "Z:357", label: "⟶ Compare 10, 20, 30 Year Term" },
      { value: "Z:123456790TUVABCDEGH", label: "⟶ All Level Term Products" },
    ],
  },
  {
    label: "─── TERM LIFE (Simplified Issue Friendly) ───",
    description: "Many carriers offer simplified issue (no exam) at lower face amounts — typically under $250K–$500K",
    options: [
      { value: "1", label: "1 Year Annual Renewable Term" },
      { value: "2", label: "5 Year Level Term" },
      { value: "T", label: "Term to Age 65" },
      { value: "U", label: "Term to Age 70" },
      { value: "V", label: "Term to Age 75" },
      { value: "A", label: "Term to Age 80" },
      { value: "B", label: "Term to Age 85" },
      { value: "C", label: "Term to Age 90" },
      { value: "D", label: "Term to Age 95" },
      { value: "E", label: "Term to Age 100" },
      { value: "G", label: "Term to Age 105" },
      { value: "H", label: "Term to Age 110" },
      { value: "F", label: "Other Term" },
    ],
  },
  {
    label: "─── RETURN OF PREMIUM TERM ───",
    description: "Get premiums refunded if you outlive the term — typically requires paramed",
    options: [
      { value: "J", label: "15 Year Return of Premium" },
      { value: "K", label: "20 Year Return of Premium" },
      { value: "L", label: "25 Year Return of Premium" },
      { value: "M", label: "30 Year Return of Premium" },
      { value: "W", label: "To Age 65 Return of Premium" },
      { value: "Z:JKM", label: "⟶ Compare 15, 20, 30 Year ROP" },
      { value: "Z:JKLMW", label: "⟶ All Return of Premium Products" },
    ],
  },
  {
    label: "─── PERMANENT (No Lapse Universal Life) ───",
    description: "Guaranteed to age 121 — some carriers offer simplified issue at lower face amounts",
    options: [
      { value: "8", label: "No Lapse UL — Lifetime Pay" },
      { value: "P", label: "No Lapse UL — Pay to 100" },
      { value: "Q", label: "No Lapse UL — Pay to 65" },
      { value: "R", label: "No Lapse UL — 20 Pay" },
      { value: "S", label: "No Lapse UL — 10 Pay" },
      { value: "O", label: "No Lapse UL — Single Pay" },
    ],
  },
  {
    label: "─── FINAL EXPENSE ───",
    description: "Permanent products for final expense — includes Simplified Issue and Guaranteed Issue",
    options: [
      { value: "Z:8PQRSOY", label: "All Final Expense Products (SI + GI)" },
      { value: "Z:8PQRSO", label: "Simplified Issue Only" },
      { value: "Y", label: "Guaranteed Issue Only (Graded Benefit WL)" },
    ],
  },
];

const FACE_AMOUNTS = [
  { value: "10000", label: "$10,000" },
  { value: "25000", label: "$25,000" },
  { value: "50000", label: "$50,000" },
  { value: "100000", label: "$100,000" },
  { value: "150000", label: "$150,000" },
  { value: "200000", label: "$200,000" },
  { value: "250000", label: "$250,000" },
  { value: "300000", label: "$300,000" },
  { value: "400000", label: "$400,000" },
  { value: "500000", label: "$500,000" },
  { value: "750000", label: "$750,000" },
  { value: "1000000", label: "$1,000,000" },
  { value: "1500000", label: "$1,500,000" },
  { value: "2000000", label: "$2,000,000" },
];

type Props = {
  onSubmit: (request: LifeQuoteRequest) => void;
  isLoading: boolean;
  enabledStates?: string[];   // Admin-configured licensed states
  enabledCarriers?: string[]; // Admin-configured enabled carrier codes
};

export default function LifeInsuranceForm({ onSubmit, isLoading, enabledStates = [], enabledCarriers = [] }: Props) {
  const [state, setState] = useState("23"); // Michigan
  const [zipCode, setZipCode] = useState("");
  const [birthMonth, setBirthMonth] = useState("6");
  const [birthDay, setBirthDay] = useState("15");
  const [birthYear, setBirthYear] = useState("1970");
  const [gender, setGender] = useState<"M" | "F">("M");
  const [smoker, setSmoker] = useState<"Y" | "N">("N");
  const [health, setHealth] = useState("PP");
  const [category, setCategory] = useState("5");
  const [faceAmount, setFaceAmount] = useState("500000");
  const [mode, setMode] = useState("M");

  // Generate year options (1930 to current year - 18)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 18 - 1930 + 1 }, (_, i) =>
    String(1930 + i)
  );

  // Detect if the selected category falls under Final Expense
  const FINAL_EXPENSE_CATEGORIES = ["Y", "Z:8PQRSOY", "Z:8PQRSO"];
  const isFinalExpense = FINAL_EXPENSE_CATEGORIES.includes(category);

  // Coverage amount warnings based on product type
  function getCoverageWarning(): string | null {
    const amount = parseInt(faceAmount);
    // GIWL only — typically max around $25-50K
    if (category === "Y" && amount > 50000) {
      return "Guaranteed Issue (GIWL) products are typically available up to $25,000–$50,000. Reduce the coverage amount for best results.";
    }
    if (category === "Y" && amount > 25000) {
      return "Most Graded Benefit Whole Life products max out around $25,000. You may see limited results.";
    }
    // All Final Expense categories at high amounts
    if (FINAL_EXPENSE_CATEGORIES.includes(category) && category !== "Y" && amount > 50000) {
      return "Final expense products are typically $10,000–$50,000 in coverage. Higher amounts may return fewer results.";
    }
    // Simplified issue friendly categories at high amounts
    const siCategories = ["1", "2", "T", "U", "V", "A", "B", "C", "D", "E", "G", "H", "F"];
    if (siCategories.includes(category) && amount > 500000) {
      return "At this coverage amount, most carriers will require full underwriting (paramed exam). For simplified issue (no exam), consider $250,000 or less.";
    }
    return null;
  }

  const coverageWarning = getCoverageWarning();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      state,
      zipCode,
      birthMonth,
      birthDay,
      birthYear,
      gender,
      smoker,
      health,
      category,
      faceAmount,
      mode,
      isFinalExpense,
      compInc: enabledCarriers.length > 0 ? enabledCarriers.join(",") : undefined,
    });
  }

  const selectClass =
    "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";
  const labelClass = "block text-sm font-semibold text-gray-700 mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* State & ZIP */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>State</label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className={selectClass}
          >
            {(enabledStates.length > 0
              ? US_STATES.filter((s) => enabledStates.includes(s.code))
              : US_STATES
            ).map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>ZIP Code</label>
          <input
            type="text"
            value={zipCode}
            onChange={(e) =>
              setZipCode(e.target.value.replace(/\D/g, "").slice(0, 5))
            }
            placeholder="48383"
            className={selectClass}
          />
        </div>
      </div>

      {/* Birthdate */}
      <div>
        <label className={labelClass}>Date of Birth</label>
        <div className="grid grid-cols-3 gap-2">
          <select
            value={birthMonth}
            onChange={(e) => setBirthMonth(e.target.value)}
            className={selectClass}
          >
            {[
              "January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December",
            ].map((m, i) => (
              <option key={i} value={String(i + 1)}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={birthDay}
            onChange={(e) => setBirthDay(e.target.value)}
            className={selectClass}
          >
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>
                {i + 1}
              </option>
            ))}
          </select>
          <select
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            className={selectClass}
          >
            {years.reverse().map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Gender */}
      <div>
        <label className={labelClass}>Gender</label>
        <div className="flex gap-4">
          {[
            { value: "M" as const, label: "Male" },
            { value: "F" as const, label: "Female" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex-1 text-center py-2 rounded border-2 cursor-pointer transition-colors text-sm font-medium ${
                gender === opt.value
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="gender"
                value={opt.value}
                checked={gender === opt.value}
                onChange={() => setGender(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Smoker */}
      <div>
        <label className={labelClass}>Tobacco / Smoker</label>
        <div className="flex gap-4">
          {[
            { value: "N" as const, label: "No" },
            { value: "Y" as const, label: "Yes" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={`flex-1 text-center py-2 rounded border-2 cursor-pointer transition-colors text-sm font-medium ${
                smoker === opt.value
                  ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="smoker"
                value={opt.value}
                checked={smoker === opt.value}
                onChange={() => setSmoker(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {/* Health Class */}
      <div>
        <label className={labelClass}>Health Class</label>
        <select
          value={health}
          onChange={(e) => setHealth(e.target.value)}
          className={selectClass}
        >
          {HEALTH_CLASSES.map((h) => (
            <option key={h.value} value={h.value}>
              {h.label}
            </option>
          ))}
        </select>
      </div>

      {/* Product Type */}
      <div>
        <label className={labelClass}>Type of Insurance</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={selectClass}
        >
          {PRODUCT_CATEGORY_GROUPS.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.options.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">
          {PRODUCT_CATEGORY_GROUPS.find((g) =>
            g.options.some((o) => o.value === category)
          )?.description || ""}
        </p>
      </div>

      {/* Face Amount & Premium Mode */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Coverage Amount</label>
          <select
            value={faceAmount}
            onChange={(e) => setFaceAmount(e.target.value)}
            className={selectClass}
          >
            {FACE_AMOUNTS.map((a) => (
              <option key={a.value} value={a.value}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Premium Display</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className={selectClass}
          >
            <option value="M">Monthly</option>
            <option value="Q">Quarterly</option>
            <option value="H">Semi-Annual</option>
            <option value="ALL">All</option>
          </select>
        </div>
      </div>

      {/* Coverage Warning */}
      {coverageWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <p className="text-xs text-amber-800">{coverageWarning}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-emerald-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Getting Quotes..." : "Get Life Insurance Quotes"}
      </button>
    </form>
  );
}
