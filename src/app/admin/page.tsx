"use client";

import { useState, useEffect } from "react";

// ---- State List (matches Compulife codes) ----
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
  { code: "33", name: "New York" }, { code: "52", name: "NY Non-Business" },
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

type CompulifeCompany = {
  CompCode: string;
  Name: string;
};

export default function AdminPage() {
  // Auth
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");

  // Settings state
  const [enabledCarriers, setEnabledCarriers] = useState<Set<string>>(new Set());
  const [enabledStates, setEnabledStates] = useState<Set<string>>(new Set());
  const [applicationEmails, setApplicationEmails] = useState("");
  const [moreInfoUrl, setMoreInfoUrl] = useState("");

  // Company list from Compulife
  const [companies, setCompanies] = useState<CompulifeCompany[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);

  // UI state
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [carrierSearch, setCarrierSearch] = useState("");

  // Load companies from Compulife on mount
  useEffect(() => {
    fetch("/api/life-companies")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const sorted = data.sort((a: CompulifeCompany, b: CompulifeCompany) =>
            a.Name.localeCompare(b.Name)
          );
          setCompanies(sorted);
        }
      })
      .catch(() => {})
      .finally(() => setCompaniesLoading(false));
  }, []);

  // Load settings after auth
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch("/api/admin-settings")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setEnabledCarriers(new Set(data.enabled_carriers || []));
          setEnabledStates(new Set(data.enabled_states || []));
          setApplicationEmails(data.application_emails || "");
          setMoreInfoUrl(data.more_info_url || "");
        }
      })
      .catch(() => {});
  }, [isAuthenticated]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    // Test the password by making a dummy save request
    fetch("/api/admin-settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, updated_at: new Date().toISOString() }),
    })
      .then((r) => {
        if (r.ok) {
          setIsAuthenticated(true);
          setAuthError("");
        } else {
          setAuthError("Invalid password");
        }
      })
      .catch(() => setAuthError("Connection error"));
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/admin-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          enabled_carriers: Array.from(enabledCarriers),
          enabled_states: Array.from(enabledStates),
          application_emails: applicationEmails,
          more_info_url: moreInfoUrl,
        }),
      });
      if (res.ok) {
        setSaveMessage({ type: "success", text: "Settings saved successfully!" });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        const data = await res.json();
        setSaveMessage({ type: "error", text: data.error || "Failed to save" });
      }
    } catch {
      setSaveMessage({ type: "error", text: "Connection error" });
    } finally {
      setSaving(false);
    }
  }

  function toggleCarrier(code: string) {
    setEnabledCarriers((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function toggleState(code: string) {
    setEnabledStates((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  function selectAllCarriers() {
    setEnabledCarriers(new Set(companies.map((c) => c.CompCode)));
  }

  function deselectAllCarriers() {
    setEnabledCarriers(new Set());
  }

  function selectAllStates() {
    setEnabledStates(new Set(US_STATES.map((s) => s.code)));
  }

  function deselectAllStates() {
    setEnabledStates(new Set());
  }

  // Filter companies by search
  const filteredCompanies = carrierSearch
    ? companies.filter((c) =>
        c.Name.toLowerCase().includes(carrierSearch.toLowerCase())
      )
    : companies;

  // ---- LOGIN SCREEN ----
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Admin Settings
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Golden Age Quoting Tool — Control Panel
          </p>
          <form onSubmit={handleLogin}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Enter admin password"
              autoFocus
            />
            {authError && (
              <p className="text-sm text-red-600 mt-2">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full mt-4 bg-emerald-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ---- ADMIN PANEL ----
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Golden Age Quoting — Admin Settings
            </h1>
            <p className="text-sm text-gray-500">
              Control which carriers and states appear in the quoting tool
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saveMessage && (
              <span
                className={`text-sm font-medium ${
                  saveMessage.type === "success"
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {saveMessage.text}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <a
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              ← Back to Quoting
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: Companies to Quote */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                Companies to Quote
              </h2>
              <span className="text-sm text-gray-500">
                {enabledCarriers.size} of {companies.length} selected
              </span>
            </div>

            <p className="text-sm text-gray-500 mb-3">
              Select the carriers you want to show in quote results. If none are
              selected, all carriers will be shown.
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={selectAllCarriers}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded hover:bg-emerald-200 transition-colors"
              >
                All On
              </button>
              <button
                onClick={deselectAllCarriers}
                className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                All Off
              </button>
            </div>

            {/* Search */}
            <input
              type="text"
              value={carrierSearch}
              onChange={(e) => setCarrierSearch(e.target.value)}
              placeholder="Search carriers..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />

            {/* Carrier list */}
            <div className="max-h-[500px] overflow-y-auto border border-gray-200 rounded-lg">
              {companiesLoading ? (
                <p className="p-4 text-sm text-gray-500">
                  Loading carriers from Compulife...
                </p>
              ) : (
                filteredCompanies.map((company) => (
                  <label
                    key={company.CompCode}
                    className={`flex items-center px-3 py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50 text-sm ${
                      enabledCarriers.has(company.CompCode)
                        ? "bg-emerald-50"
                        : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={enabledCarriers.has(company.CompCode)}
                      onChange={() => toggleCarrier(company.CompCode)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 mr-3"
                    />
                    <span className="flex-1">{company.Name}</span>
                    <span className="text-xs text-gray-400 font-mono">
                      {company.CompCode}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* RIGHT: States + Other Settings */}
          <div className="space-y-6">
            {/* States */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">
                  Licensed States
                </h2>
                <span className="text-sm text-gray-500">
                  {enabledStates.size} of {US_STATES.length} selected
                </span>
              </div>

              <p className="text-sm text-gray-500 mb-3">
                Select the states you are licensed to sell insurance in. Only
                these states will appear in the quoting form dropdown. If none
                are selected, all states will be shown.
              </p>

              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={selectAllStates}
                  className="px-3 py-1.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded hover:bg-emerald-200 transition-colors"
                >
                  All On
                </button>
                <button
                  onClick={deselectAllStates}
                  className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  All Off
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1 max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg p-2">
                {US_STATES.map((state) => (
                  <label
                    key={state.code}
                    className={`flex items-center px-2 py-1.5 rounded cursor-pointer hover:bg-gray-50 text-sm ${
                      enabledStates.has(state.code) ? "bg-emerald-50" : ""
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={enabledStates.has(state.code)}
                      onChange={() => toggleState(state.code)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 mr-2"
                    />
                    {state.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Application Emails */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-2">
                Application Request Emails
              </h2>
              <p className="text-sm text-gray-500 mb-3">
                Comma-separated email addresses that receive application
                requests.
              </p>
              <input
                type="text"
                value={applicationEmails}
                onChange={(e) => setApplicationEmails(e.target.value)}
                placeholder="email@example.com, email2@example.com"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* More Info URL */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-2">
                More Info URL
              </h2>
              <p className="text-sm text-gray-500 mb-3">
                Web page address for the &quot;More Info&quot; button on quote
                results.
              </p>
              <input
                type="text"
                value={moreInfoUrl}
                onChange={(e) => setMoreInfoUrl(e.target.value)}
                placeholder="https://www.yourdomain.com/info"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Bottom save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save All Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
