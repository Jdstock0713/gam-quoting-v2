import type { MAPlan, MAPlanDetail, PDPPlan, PharmacyCostRow, DrugCoverageRow } from "@/types";

/** Read first matching key from a plan detail object (Medicare uses mixed naming). */
export function pickDetail(d: MAPlanDetail, keys: string[]): unknown {
  for (const k of keys) {
    if (Object.prototype.hasOwnProperty.call(d, k)) {
      const v = d[k];
      if (v !== undefined && v !== null && v !== "") return v;
    }
  }
  return undefined;
}

export function cellString(val: unknown, maxLen = 280): string {
  if (val === undefined || val === null) return "—";
  if (typeof val === "boolean") return val ? "Yes" : "No";
  if (typeof val === "number") return Number.isFinite(val) ? String(val) : "—";
  if (typeof val === "string") return val.trim() || "—";
  if (Array.isArray(val)) {
    const parts = val.map((x) => cellString(x, 120));
    const s = parts.join("; ");
    return s.length > maxLen ? `${s.slice(0, maxLen - 1)}…` : s;
  }
  if (typeof val === "object") {
    const o = val as Record<string, unknown>;
    const parts = Object.entries(o).map(([k, v]) => `${k}: ${cellString(v, 80)}`);
    const s = parts.join(" · ");
    return s.length > maxLen ? `${s.slice(0, maxLen - 1)}…` : s;
  }
  return String(val);
}

function formatFeatureKey(k: string): string {
  return k
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Medicare.gov-aligned benefit rows — always shown in compare; fill with "—" when missing. */
export const REQUIRED_BENEFIT_KEYS: { key: string; label: string; apiKeys: string[] }[] = [
  { key: "primary", label: "Primary doctor visit", apiKeys: ["primary_care", "primaryCare", "primary_doctor"] },
  { key: "specialist", label: "Specialist visit", apiKeys: ["specialist", "specialistVisit", "specialist_care"] },
  {
    key: "diagnostic",
    label: "Diagnostic tests & procedures",
    apiKeys: ["diagnostic_tests", "diagnosticTests", "diagnostic_procedures"],
  },
  { key: "lab", label: "Lab services", apiKeys: ["lab_services", "labServices", "laboratory"] },
  {
    key: "radiology",
    label: "Diagnostic radiology (MRI)",
    apiKeys: ["diagnostic_radiology", "radiology", "mri", "diagnostic_radiology_services"],
  },
  { key: "xrays", label: "Outpatient x-rays", apiKeys: ["outpatient_xray", "xrays", "outpatient_x_rays"] },
  { key: "emergency", label: "Emergency care", apiKeys: ["emergency_care", "emergencyCare", "emergency"] },
  { key: "urgent", label: "Urgent care", apiKeys: ["urgent_care", "urgentCare"] },
  { key: "inpatient", label: "Inpatient hospital coverage", apiKeys: ["inpatient", "inpatient_hospital", "inpatientHospital"] },
  {
    key: "outpatient",
    label: "Outpatient hospital coverage",
    apiKeys: ["outpatient", "outpatient_hospital", "outpatientHospital"],
  },
  { key: "preventive", label: "Preventive services", apiKeys: ["preventive", "preventive_services", "preventiveCare"] },
];

export type BenefitRow = { key: string; label: string; text: string };

function normalizeKey(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function trySetFeature(m: Map<string, boolean>, label: string, v: unknown) {
  if (typeof v === "boolean") m.set(label, v);
  else if (v === "Y" || v === "YES" || v === "true") m.set(label, true);
  else if (v === "N" || v === "NO" || v === "false") m.set(label, false);
}

/** Explicit Medicare.gov-style feature labels → API key fallbacks */
export const EXPLICIT_FEATURE_LOOKUPS: [string, string[]][] = [
  ["Worldwide emergency", ["worldwide_emergency", "worldwideEmergency", "emergency_worldwide"]],
  ["In-home support services", ["in_home_support", "inHomeSupport", "home_support_services"]],
  [
    "Personal Emergency Response System (PERS)",
    ["pers", "personal_emergency_response", "personalEmergencyResponse"],
  ],
  ["Routine chiropractic service", ["chiropractic", "routine_chiropractic", "chiropracticService"]],
  ["Home and bathroom safety devices", ["home_safety_devices", "homeBathroomSafety", "bathroom_safety"]],
  ["Meals for short duration", ["meals", "meals_short_duration", "mealsBenefit"]],
  ["Annual physical exams", ["annual_physical", "annualPhysicalExam", "physical_exam"]],
  ["Endodontics", ["endodontics", "endodonticServices"]],
  ["Periodontics", ["periodontics", "periodonticServices"]],
];

function applyExplicitFeatureLookups(d: MAPlanDetail, m: Map<string, boolean>) {
  for (const [label, keys] of EXPLICIT_FEATURE_LOOKUPS) {
    if (m.has(label)) continue;
    const v = pickDetail(d, keys);
    if (v !== undefined) trySetFeature(m, label, v);
  }
}

/** Boolean-ish feature flags from nested API shapes. */
export function extractFeatureMap(d: MAPlanDetail): Map<string, boolean> {
  const m = new Map<string, boolean>();

  const pf =
    pickDetail(d, ["plan_features", "planFeatures", "features", "additional_benefits"]) ??
    undefined;

  if (Array.isArray(pf)) {
    for (const item of pf) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const label = String(
        o.name ??
          o.feature_name ??
          o.title ??
          o.description ??
          o.type ??
          o.id ??
          ""
      ).trim();
      if (!label) continue;
      const inc =
        o.included ??
        o.available ??
        o.enabled ??
        o.offered ??
        o.value ??
        o.is_covered;
      if (typeof inc === "boolean") m.set(label, inc);
      else if (inc === "Y" || inc === "YES") m.set(label, true);
      else if (inc === "N" || inc === "NO") m.set(label, false);
    }
  } else if (pf && typeof pf === "object") {
    for (const [k, v] of Object.entries(pf as Record<string, unknown>)) {
      trySetFeature(m, formatFeatureKey(k), v);
    }
  }

  const nested = pickDetail(d, ["benefit_package", "benefitPackage"]) as
    | Record<string, unknown>
    | undefined;
  if (nested && typeof nested === "object") {
    for (const [k, v] of Object.entries(nested)) {
      if (typeof v === "boolean") trySetFeature(m, formatFeatureKey(k), v);
    }
  }

  applyExplicitFeatureLookups(d, m);
  return m;
}

export function isPpoPlan(plan: MAPlan | undefined): boolean {
  if (!plan) return false;
  return plan.category.includes("PPO");
}

function formatCopayRange(cs: {
  min_copay: number;
  max_copay: number;
  min_coinsurance: number | null;
  max_coinsurance: number | null;
}): string {
  if (cs.min_coinsurance != null || cs.max_coinsurance != null) {
    return `${cs.min_coinsurance ?? 0}-${cs.max_coinsurance ?? 0}% coinsurance`;
  }
  if (cs.min_copay === cs.max_copay) return `$${cs.min_copay} copay`;
  return `$${cs.min_copay}-$${cs.max_copay} copay`;
}

/** In-network + optional OON lines for PPO from a benefit object. */
export function formatBenefitInOut(
  o: Record<string, unknown> | null,
  plan: MAPlan | undefined
): string {
  if (!o) return "—";
  const inn =
    pickDetail(o as MAPlanDetail, [
      "in_network",
      "inNetwork",
      "in_network_cost",
      "summary",
      "description",
    ]) ?? o;
  const inText = typeof inn === "object" && inn !== null ? cellString(inn, 200) : cellString(inn, 200);

  if (!isPpoPlan(plan)) return inText;

  const oon =
    pickDetail(o as MAPlanDetail, [
      "out_of_network",
      "outOfNetwork",
      "oon_cost",
      "oon",
      "out_of_network_cost",
    ]) ?? undefined;
  const oonText = oon !== undefined ? cellString(oon, 200) : "";
  if (!oonText || oonText === "—") return `In-network: ${inText}`;
  return `In-network: ${inText}\nOut-of-network: ${oonText}`;
}

/** Find dynamic benefit row matching required category. */
function findDynamicRow(dynamic: BenefitRow[], req: (typeof REQUIRED_BENEFIT_KEYS)[0]): BenefitRow | undefined {
  const nk = req.key;
  for (const r of dynamic) {
    const l = normalizeKey(r.key + " " + r.label);
    if (l.includes(nk)) return r;
    for (const ak of req.apiKeys) {
      if (l.includes(ak.replace(/_/g, " "))) return r;
    }
  }
  return undefined;
}

/** Tiered inpatient display from arrays/objects in plan detail. */
export function formatInpatientTiers(d: MAPlanDetail): string {
  const raw = pickDetail(d, [
    "inpatient_hospital",
    "inpatientHospital",
    "inpatient",
    "inpatient_benefits",
  ]);
  if (Array.isArray(raw)) {
    const lines: string[] = [];
    for (const tier of raw) {
      if (!tier || typeof tier !== "object") continue;
      const t = tier as Record<string, unknown>;
      const days =
        pickDetail(t as MAPlanDetail, ["day_range", "days", "dayRange", "benefit_period"]) ?? "";
      const amt =
        pickDetail(t as MAPlanDetail, ["amount", "copay", "cost_per_day", "per_day"]) ?? "";
      const unit = pickDetail(t as MAPlanDetail, ["unit", "type"]) ?? "per day";
      lines.push(`${cellString(days)}: ${cellString(amt)} ${cellString(unit)}`.trim());
    }
    return lines.length ? lines.join("\n") : "";
  }
  if (raw && typeof raw === "object") return cellString(raw, 400);
  return "";
}

/** One plan’s merged required benefit texts (search + detail). */
export function buildBenefitRowTextsForPlan(
  d: MAPlanDetail | undefined,
  plan: MAPlan | undefined,
  dynamicRows: BenefitRow[]
): Map<string, string> {
  const out = new Map<string, string>();

  for (const req of REQUIRED_BENEFIT_KEYS) {
    let text = "—";

    if (req.key === "primary" && plan?.primary_doctor_cost_sharing) {
      const inn = formatCopayRange(plan.primary_doctor_cost_sharing);
      text = isPpoPlan(plan)
        ? formatBenefitInOut({ in_network: inn } as Record<string, unknown>, plan)
        : inn;
    } else if (req.key === "specialist" && plan?.specialist_doctor_cost_sharing) {
      const inn = formatCopayRange(plan.specialist_doctor_cost_sharing);
      text = isPpoPlan(plan)
        ? formatBenefitInOut({ in_network: inn } as Record<string, unknown>, plan)
        : inn;
    } else {
      if (d) {
        const direct = pickDetail(d, req.apiKeys);
        if (direct !== undefined) {
          if (typeof direct === "object" && direct !== null && !Array.isArray(direct)) {
            text = formatBenefitInOut(direct as Record<string, unknown>, plan);
          } else {
            text = cellString(direct, 400);
          }
        }
      }

      if (text === "—") {
        const hit = findDynamicRow(dynamicRows, req);
        if (hit?.text && hit.text !== "—") {
          text = formatBenefitInOut({ in_network: hit.text } as Record<string, unknown>, plan);
        }
      }

      if (req.key === "inpatient" && d) {
        const tiered = formatInpatientTiers(d);
        if (tiered) text = tierTextOrDefault(tiered, text);
      }
    }

    out.set(req.key, text);
  }

  return out;
}

function tierTextOrDefault(tiered: string, fallback: string): string {
  if (fallback === "—" || !fallback.trim()) return tiered;
  return `${fallback}\n${tiered}`;
}

/** Pull human-readable benefit / cost rows from arrays commonly returned on plan detail. */
export function extractBenefitRows(d: MAPlanDetail): BenefitRow[] {
  const raw =
    pickDetail(d, [
      "benefits",
      "medical_benefits",
      "medicalBenefits",
      "cost_sharing",
      "costSharing",
      "benefit_costs",
      "benefitCosts",
      "service_costs",
    ]) ?? undefined;

  if (!Array.isArray(raw)) return [];

  const rows: BenefitRow[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const label = String(
      o.category_name ??
        o.categoryName ??
        o.name ??
        o.title ??
        o.benefit_name ??
        o.benefitName ??
        o.service_type ??
        o.serviceType ??
        `Benefit ${i + 1}`
    ).trim();

    const inner = formatBenefitInOut(o, undefined);
    const text =
      inner !== "—"
        ? inner
        : cellString(
            o.in_network ?? o.inNetwork ?? o.in_network_cost ?? o.summary ?? o.description ?? o,
            400
          );
    const key = normalizeKey(label);
    rows.push({ key, label, text });
  }
  return rows;
}

export type ExtraSectionRow = {
  section: string;
  label: string;
  text: string;
};

/** Nested extra-benefit lines (hearing / dental / vision / more). */
export function extractStructuredExtraRows(d: MAPlanDetail): ExtraSectionRow[] {
  const out: ExtraSectionRow[] = [];
  const groups: { section: string; keys: string[] }[] = [
    { section: "Hearing", keys: ["hearing", "hearing_benefits", "hearingBenefits"] },
    { section: "Preventive dental", keys: ["preventive_dental", "preventiveDental", "dental_preventive"] },
    { section: "Comprehensive dental", keys: ["dental", "comprehensive_dental", "dental_benefits"] },
    { section: "Vision", keys: ["vision", "vision_benefits", "visionBenefits"] },
    { section: "More extra benefits", keys: ["extra_benefits", "additional_benefits_detail", "supplemental_benefits"] },
    { section: "Skilled nursing / DME / diabetes", keys: ["skilled_nursing", "dme", "diabetes", "durable_medical_equipment"] },
  ];

  for (const g of groups) {
    const v = pickDetail(d, g.keys);
    if (v === undefined || v === null) continue;
    if (typeof v === "object" && !Array.isArray(v)) {
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        out.push({
          section: g.section,
          label: formatFeatureKey(k),
          text: cellString(val, 220),
        });
      }
    } else {
      out.push({ section: g.section, label: g.section, text: cellString(v, 400) });
    }
  }
  return out;
}

/** Legacy flat extras (fallback). */
export function extractExtraSections(d: MAPlanDetail): { title: string; text: string }[] {
  const structured = extractStructuredExtraRows(d);
  if (structured.length > 0) {
    const bySection = new Map<string, string[]>();
    for (const r of structured) {
      const arr = bySection.get(r.section) ?? [];
      arr.push(`${r.label}: ${r.text}`);
      bySection.set(r.section, arr);
    }
    return Array.from(bySection.entries()).map(([title, lines]) => ({
      title,
      text: lines.join("\n"),
    }));
  }
  const titles = ["dental", "vision", "hearing", "dme", "diabetes", "skilled_nursing"] as const;
  const flat: { title: string; text: string }[] = [];
  for (const t of titles) {
    const v = pickDetail(d, [t, `${t}_benefits`, `${t}Benefits`]);
    if (v !== undefined && v !== null && typeof v === "object") {
      flat.push({
        title: formatFeatureKey(t),
        text: cellString(v, 500),
      });
    }
  }
  return flat;
}

/** Drug / pharmacy style blocks if present. */
export function extractDrugSection(d: MAPlanDetail): string {
  const v = pickDetail(d, [
    "drug_coverage",
    "drugCoverage",
    "pharmacy_costs",
    "pharmacyCosts",
    "estimated_drug_costs",
    "prescription_benefits",
  ]);
  return v !== undefined ? cellString(v, 600) : "";
}

/** Try to read per-pharmacy lines from plan search object (shape varies). */
export function extractPharmacyBreakdownFromPlan(plan: MAPlan | PDPPlan): string {
  const p = plan as unknown as Record<string, unknown>;
  const candidates = [
    p.pharmacy_costs,
    p.pharmacyCosts,
    p.estimated_pharmacy_costs,
    p.estimatedPharmacyCosts,
    p.pharmacy_summary,
    p.drug_costs_by_pharmacy,
  ];
  for (const c of candidates) {
    if (c === undefined || c === null) continue;
    if (Array.isArray(c)) {
      const lines = c.map((row) => {
        if (!row || typeof row !== "object") return cellString(row, 120);
        const o = row as Record<string, unknown>;
        const name = String(o.pharmacy_name ?? o.name ?? o.pharmacy ?? "Pharmacy");
        const tier = String(o.network_tier ?? o.tier ?? o.network_status ?? "");
        const cost = o.estimated_cost ?? o.cost ?? o.total;
        const tierPart = tier && tier !== "undefined" ? ` — ${tier}` : "";
        return `${name}${tierPart} — ${cellString(cost, 40)}`;
      });
      return lines.join("\n");
    }
    if (typeof c === "object") return cellString(c, 600);
  }
  if (plan.annual_drugs_total > 0) {
    return `Estimated annual drug cost (aggregate): ${formatMoney(plan.annual_drugs_total)}`;
  }
  return "";
}

function formatMoney(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** Structured per-pharmacy cost rows from plan search response. */
export function extractPharmacyCostTable(plan: MAPlan | PDPPlan): PharmacyCostRow[] {
  const p = plan as unknown as Record<string, unknown>;
  const candidates = [
    p.pharmacy_costs,
    p.pharmacyCosts,
    p.estimated_pharmacy_costs,
    p.estimatedPharmacyCosts,
    p.drug_costs_by_pharmacy,
  ];
  for (const c of candidates) {
    if (!Array.isArray(c)) continue;
    const rows: PharmacyCostRow[] = [];
    for (const item of c) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const name = String(o.pharmacy_name ?? o.name ?? o.pharmacy ?? "Pharmacy");
      const tier = String(o.network_tier ?? o.tier ?? o.network_status ?? o.pharmacy_type ?? "");
      const rawCost = o.estimated_annual_cost ?? o.estimated_cost ?? o.total_cost ?? o.cost ?? o.total ?? 0;
      const cost = typeof rawCost === "number" ? rawCost : parseFloat(String(rawCost).replace(/[,$]/g, "")) || 0;
      rows.push({
        pharmacyName: name,
        networkTier: tier && tier !== "undefined" ? tier : "",
        estimatedAnnualCost: cost,
      });
    }
    if (rows.length) return rows;
  }
  return [];
}

/** Check which of the user's entered drugs are covered by the plan's formulary. */
export function extractDrugCoverageStatus(
  planDetail: MAPlanDetail,
  drugNames: string[]
): DrugCoverageRow[] {
  if (!drugNames.length) return [];
  const formulary = pickDetail(planDetail, [
    "formulary",
    "drug_coverage",
    "drugCoverage",
    "covered_drugs",
    "drugs_covered",
    "formulary_drugs",
  ]);
  const formularyList = Array.isArray(formulary) ? formulary : [];

  return drugNames.map((name) => {
    const lower = name.toLowerCase().replace(/\s+/g, " ").trim();
    let found: Record<string, unknown> | null = null;

    for (const item of formularyList) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const drugName = String(o.name ?? o.drug_name ?? o.drugName ?? "").toLowerCase();
      if (drugName.includes(lower) || lower.includes(drugName.split(" ")[0])) {
        found = o;
        break;
      }
    }

    if (found) {
      const tier = cellString(found.tier ?? found.tier_name ?? found.drug_tier, 40);
      const restrictions = cellString(found.restrictions ?? found.prior_auth ?? found.quantity_limit, 60);
      return {
        drugName: name,
        covered: true,
        tier: tier !== "—" ? tier : undefined,
        restrictions: restrictions !== "—" ? restrictions : undefined,
      };
    }

    return { drugName: name, covered: formularyList.length === 0, tier: undefined, restrictions: undefined };
  });
}
