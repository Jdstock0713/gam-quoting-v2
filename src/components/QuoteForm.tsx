"use client";

import { useState } from "react";
import { QuoteRequest } from "@/types";

const PLANS = [
  { value: "A", label: "Plan A" },
  { value: "B", label: "Plan B" },
  { value: "C", label: "Plan C" },
  { value: "D", label: "Plan D" },
  { value: "F", label: "Plan F" },
  { value: "HIGH F", label: "Plan F (High Deductible)" },
  { value: "G", label: "Plan G" },
  { value: "HIGH G", label: "Plan G (High Deductible)" },
  { value: "K", label: "Plan K" },
  { value: "L", label: "Plan L" },
  { value: "M", label: "Plan M" },
  { value: "N", label: "Plan N" },
];

type Props = {
  onSubmit: (request: QuoteRequest) => void;
  isLoading: boolean;
  initialZip?: string;
};

export default function QuoteForm({ onSubmit, isLoading, initialZip }: Props) {
  const [zip, setZip] = useState(initialZip ?? "");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [tobacco, setTobacco] = useState(false);
  const [plan, setPlan] = useState("G");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!zip || !age) return;
    onSubmit({
      zip,
      age: parseInt(age, 10),
      gender,
      tobacco,
      plan,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow p-6 space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-800">Get Quotes</h2>

      {/* Plan selector — prominent at top */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Medicare Supplement Plan
        </label>
        <select
          value={plan}
          onChange={(e) => setPlan(e.target.value)}
          className="w-full border-2 border-blue-300 rounded px-3 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-blue-50"
        >
          {PLANS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* ZIP Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ZIP Code
          </label>
          <input
            type="text"
            value={zip}
            onChange={(e) =>
              setZip(e.target.value.replace(/\D/g, "").slice(0, 5))
            }
            placeholder="48383"
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Age */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Age
          </label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="65"
            min={65}
            max={99}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as "male" | "female")}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
      </div>

      {/* Tobacco Toggle */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">
          Tobacco Use
        </label>
        <button
          type="button"
          onClick={() => setTobacco(!tobacco)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            tobacco ? "bg-red-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              tobacco ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className="text-sm text-gray-500">
          {tobacco ? "Yes" : "No"}
        </span>
      </div>

      <button
        type="submit"
        disabled={isLoading || !zip || !age}
        className="w-full bg-blue-600 text-white py-2.5 px-4 rounded font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Fetching from Medicare.gov..." : "Get Quotes"}
      </button>
    </form>
  );
}
