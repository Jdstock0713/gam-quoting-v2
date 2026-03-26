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

/* ------------------------------------------------------------------ */
/*  Medicare enum / label humanization                                 */
/* ------------------------------------------------------------------ */

const TIER_LABELS: Record<string, string> = {
  COST_SHARE_TIER_PREFERRED_GENERIC: "Preferred Generic",
  COST_SHARE_TIER_GENERIC: "Generic",
  COST_SHARE_TIER_PREFERRED_BRAND: "Preferred Brand",
  COST_SHARE_TIER_NON_PREFERRED_DRUG: "Non-Preferred Drug",
  COST_SHARE_TIER_SPECIALTY_TIER: "Specialty Tier",
  COST_SHARE_TIER_SELECT_CARE_DRUGS: "Select Care Drugs",
  COST_SHARE_TIER_INJECTABLE_DRUGS: "Injectable Drugs",
};

function humanizeMedicareEnum(raw: string): string {
  if (!raw || typeof raw !== "string") return raw;
  const known = TIER_LABELS[raw];
  if (known) return known;
  return raw
    .replace(/^(SB_CAT_|SB_|BENEFIT_|SUPPLEMENTAL_|COST_SHARE_TIER_|AVAILABILITY_|NETWORK_TYPE_|PLAN_CATEGORY_|PLAN_TYPE_)/i, "")
    .replace(/_/g, " ")
    .replace(/\b[A-Z]{2,}\b/g, (w) => w.charAt(0) + w.slice(1).toLowerCase())
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bOopc\b/i, "Out-of-Pocket")
    .replace(/\bVbid\b/i, "VBID")
    .replace(/\bUf\b/i, "UF")
    .replace(/\bSsbci\b/i, "SSBCI")
    .replace(/\bPers\b/i, "PERS")
    .replace(/\bDme\b/i, "DME")
    .replace(/\bOtc\b/i, "OTC")
    .replace(/\bN\/a\b/i, "N/A")
    .trim();
}

function humanizeCoverage(raw: string): string {
  if (!raw) return "";
  const map: Record<string, string> = {
    SB_COVERAGE_SOME_COVERAGE: "Covered",
    SB_COVERAGE_NOT_COVERED: "Not covered",
    SB_COVERAGE_FULL_COVERAGE: "Fully covered",
  };
  return map[raw] ?? humanizeMedicareEnum(raw);
}

/* ------------------------------------------------------------------ */
/*  Structured formatters for Medicare plan detail shapes              */
/* ------------------------------------------------------------------ */

function formatDrugTierPhase(phase: Record<string, unknown>): string {
  const tiers = phase.tiers;
  if (!Array.isArray(tiers) || !tiers.length) return "—";
  const lines: string[] = [];
  for (const t of tiers) {
    if (!t || typeof t !== "object") continue;
    const o = t as Record<string, unknown>;
    const label = humanizeMedicareEnum(String(o.label ?? ""));
    const prefRetail = o.preferred_retail as Record<string, unknown> | undefined;
    const stdRetail = o.standard_retail as Record<string, unknown> | undefined;
    const costs: string[] = [];
    const d30 = prefRetail?.days_30 ?? stdRetail?.days_30;
    const d90 = prefRetail?.days_90 ?? stdRetail?.days_90;
    if (d30 && String(d30).trim()) costs.push(`30-day: ${d30}`);
    if (d90 && String(d90).trim()) costs.push(`90-day: ${d90}`);
    if (costs.length) lines.push(`${label}: ${costs.join(", ")}`);
    else lines.push(label);
  }
  return lines.join("\n");
}

export function formatAbstractBenefits(ab: Record<string, unknown>): ExtraSectionRow[] {
  const out: ExtraSectionRow[] = [];
  const section = "Drug cost-sharing";
  const initial = ab.initial_coverage as Record<string, unknown> | undefined;
  if (initial) {
    out.push({ section, label: "Initial coverage", text: formatDrugTierPhase(initial) });
  }
  const gap = ab.coverage_gap;
  if (gap && typeof gap === "object" && !Array.isArray(gap)) {
    out.push({ section, label: "Coverage gap (donut hole)", text: formatDrugTierPhase(gap as Record<string, unknown>) });
  }
  const cat = ab.catastrophic;
  if (cat && typeof cat === "object" && !Array.isArray(cat)) {
    out.push({ section, label: "Catastrophic coverage", text: formatDrugTierPhase(cat as Record<string, unknown>) });
  }
  return out;
}

function formatSbCostInfo(info: Record<string, unknown>): string {
  const parts: string[] = [];
  const copayMin = info.copay_min as number | null;
  const copayMax = info.copay_max as number | null;
  if (copayMin != null || copayMax != null) {
    const a = copayMin ?? 0;
    const b = copayMax ?? 0;
    parts.push(a === b ? `$${a} copay` : `$${a}-$${b} copay`);
  }
  const coinsMin = info.coins_min_pct as number | null;
  const coinsMax = info.coins_max_pct as number | null;
  if (coinsMin != null || coinsMax != null) {
    const a = coinsMin ?? 0;
    const b = coinsMax ?? 0;
    parts.push(a === b ? `${a}% coinsurance` : `${a}-${b}% coinsurance`);
  }
  if (info.authorization_required === true) parts.push("prior auth");
  if (info.referral_required === true) parts.push("referral");
  return parts.length ? parts.join(", ") : "";
}

function formatSupplementalBenefits(sb: Record<string, unknown>): ExtraSectionRow[] {
  const out: ExtraSectionRow[] = [];
  const section = "Supplemental benefits";
  const buckets = [
    ...(Array.isArray(sb.other_benefits) ? sb.other_benefits : []),
    ...(Array.isArray(sb.special_benefits) ? sb.special_benefits : []),
    ...(Array.isArray(sb.mmp_benefits) ? sb.mmp_benefits : []),
  ];
  for (const cat of buckets) {
    if (!cat || typeof cat !== "object") continue;
    const c = cat as Record<string, unknown>;
    const catLabel = humanizeMedicareEnum(String(c.category ?? ""));
    const benefits = Array.isArray(c.benefits) ? c.benefits : [];
    const lines: string[] = [];
    for (const b of benefits) {
      if (!b || typeof b !== "object") continue;
      const bo = b as Record<string, unknown>;
      const name = humanizeMedicareEnum(String(bo.benefit ?? ""));
      const cov = humanizeCoverage(String(bo.coverage ?? ""));
      const info = bo.info as Record<string, unknown> | null;
      const costDetail = info ? formatSbCostInfo(info) : "";
      const detail = [cov, costDetail].filter(Boolean).join(" — ");
      lines.push(detail ? `${name}: ${detail}` : name);
    }
    if (lines.length) {
      out.push({ section, label: catLabel, text: lines.join("\n") });
    }
  }
  return out;
}

function formatOptionalBenefits(opt: unknown[]): ExtraSectionRow[] {
  const out: ExtraSectionRow[] = [];
  const section = "Optional supplemental packages";
  for (const item of opt) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const pkgNum = o.package_number ?? "—";
    const premium = o.monthly_premium ?? "—";
    const deductible = o.deductible ?? "—";
    const benefitList = Array.isArray(o.benefits)
      ? o.benefits.map((b: unknown) => humanizeMedicareEnum(String(b))).join(", ")
      : "—";
    out.push({
      section,
      label: `Package ${pkgNum}`,
      text: `Monthly premium: ${premium}\nDeductible: ${deductible}\nIncludes: ${benefitList}`,
    });
  }
  return out;
}

function formatPackageBenefits(pb: Record<string, unknown>): ExtraSectionRow[] {
  const out: ExtraSectionRow[] = [];
  const section = "Plan cost limits";
  for (const [rawKey, val] of Object.entries(pb)) {
    if (!val || typeof val !== "object") continue;
    const label = humanizeMedicareEnum(rawKey);
    const v = val as Record<string, unknown>;
    const networkCosts = v.network_costs as Record<string, unknown> | undefined;
    if (!networkCosts) continue;
    const lines: string[] = [];
    for (const [netType, netVal] of Object.entries(networkCosts)) {
      if (!netVal || typeof netVal !== "object") continue;
      const n = netVal as Record<string, unknown>;
      const costShare = String(n.cost_share ?? "—").replace(/<br\s*\/?>/gi, "; ");
      const prefix = netType === "NETWORK_TYPE_NA" ? "" : `${humanizeMedicareEnum(netType)}: `;
      lines.push(`${prefix}${costShare}`);
    }
    out.push({ section, label, text: lines.join("\n") });
  }
  return out;
}

/** Medicare.gov-aligned benefit rows — always shown in compare; fill with "—" when missing. */
export const REQUIRED_BENEFIT_KEYS: { key: string; label: string; apiKeys: string[] }[] = [
  { key: "primary", label: "Primary doctor visit", apiKeys: ["primary_care", "primaryCare", "primary_doctor", "primary_care_visit", "primaryCareVisit", "primary_care_services"] },
  { key: "specialist", label: "Specialist visit", apiKeys: ["specialist", "specialistVisit", "specialist_care", "specialist_visit", "specialist_care_visit"] },
  {
    key: "diagnostic",
    label: "Diagnostic tests & procedures",
    apiKeys: ["diagnostic_tests", "diagnosticTests", "diagnostic_procedures", "diagnostic_services", "tests_and_procedures", "diagnostic_test_services"],
  },
  { key: "lab", label: "Lab services", apiKeys: ["lab_services", "labServices", "laboratory", "lab", "laboratory_services"] },
  {
    key: "radiology",
    label: "Diagnostic radiology (MRI)",
    apiKeys: ["diagnostic_radiology", "radiology", "mri", "diagnostic_radiology_services", "imaging", "advanced_imaging", "radiology_services"],
  },
  { key: "xrays", label: "Outpatient x-rays", apiKeys: ["outpatient_xray", "xrays", "outpatient_x_rays", "xray", "x_rays", "xray_services"] },
  { key: "emergency", label: "Emergency care", apiKeys: ["emergency_care", "emergencyCare", "emergency", "emergency_services", "er"] },
  { key: "urgent", label: "Urgent care", apiKeys: ["urgent_care", "urgentCare", "urgent_care_services", "urgent"] },
  { key: "inpatient", label: "Inpatient hospital coverage", apiKeys: ["inpatient", "inpatient_hospital", "inpatientHospital", "inpatient_hospital_coverage", "inpatient_hospital_services"] },
  {
    key: "outpatient",
    label: "Outpatient hospital coverage",
    apiKeys: ["outpatient", "outpatient_hospital", "outpatientHospital", "outpatient_hospital_coverage", "outpatient_hospital_services"],
  },
  { key: "preventive", label: "Preventive services", apiKeys: ["preventive", "preventive_services", "preventiveCare", "preventive_care_services", "wellness"] },
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
        const direct = deepPickDetail(d, req.apiKeys);
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

function walkForFirstKey(
  val: unknown,
  wanted: Set<string>,
  depth = 0
): unknown {
  if (depth > 5 || val == null) return undefined;
  if (Array.isArray(val)) {
    for (const item of val) {
      const hit = walkForFirstKey(item, wanted, depth + 1);
      if (hit !== undefined) return hit;
    }
    return undefined;
  }
  if (typeof val !== "object") return undefined;
  const o = val as Record<string, unknown>;
  for (const [k, v] of Object.entries(o)) {
    if (wanted.has(k.toLowerCase())) return v;
  }
  for (const v of Object.values(o)) {
    const hit = walkForFirstKey(v, wanted, depth + 1);
    if (hit !== undefined) return hit;
  }
  return undefined;
}

function deepPickDetail(d: MAPlanDetail, keys: string[]): unknown {
  const direct = pickDetail(d, keys);
  if (direct !== undefined) return direct;
  const wanted = new Set(keys.map((k) => k.toLowerCase()));
  return walkForFirstKey(d, wanted, 0);
}

function formatMaCostSharingEntry(e: Record<string, unknown>): string {
  const ns = e.network_status;
  const isOon = ns === "OUT_OF_NETWORK" || ns === "out_of_network";
  const label = isOon ? "Out-of-network" : "In-network";
  const minC = e.min_coinsurance;
  const maxC = e.max_coinsurance;
  if (minC != null || maxC != null) {
    return `${label}: ${Number(minC ?? 0)}-${Number(maxC ?? 0)}% coinsurance`;
  }
  const minP = e.min_copay;
  const maxP = e.max_copay;
  if (minP != null || maxP != null) {
    const a = Number(minP);
    const b = Number(maxP);
    if (a === b) return `${label}: $${a} copay`;
    return `${label}: $${a}-$${b} copay`;
  }
  return `${label}: —`;
}

function formatMaBenefitCostSharing(raw: unknown): string {
  if (!Array.isArray(raw) || raw.length === 0) return "—";
  const lines: string[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    lines.push(formatMaCostSharingEntry(item as Record<string, unknown>));
  }
  return lines.length ? lines.join("\n") : "—";
}

function humanizeMaService(service: string): string {
  if (!service) return "Benefit";
  return humanizeMedicareEnum(service);
}

/**
 * Medicare GET /plan/... returns medical cost-sharing on `ma_benefits` (not legacy `benefits` arrays).
 * Each item: service, category, cost_sharing[{ network_status, copay/coinsurance }], tiered_cost_sharing, etc.
 */
export function extractMaBenefitRows(d: MAPlanDetail): BenefitRow[] {
  const raw = pickDetail(d, ["ma_benefits", "maBenefits"]);
  if (!Array.isArray(raw)) return [];

  const rows: BenefitRow[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i];
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const service = String(o.service ?? "");
    const baseLabel = humanizeMaService(service);
    let text = formatMaBenefitCostSharing(o.cost_sharing);
    if (text === "—" && o.tiered_cost_sharing != null) {
      text = cellString(o.tiered_cost_sharing, 400);
    }
    const flags: string[] = [];
    if (o.authorization_required === true) flags.push("prior auth may apply");
    if (o.referral_required === true) flags.push("referral may apply");
    const label = flags.length ? `${baseLabel} (${flags.join("; ")})` : baseLabel;
    const key = normalizeKey(`${service} ${baseLabel}`);
    rows.push({ key, label, text });
  }
  return rows;
}

/** Pull human-readable benefit / cost rows from arrays commonly returned on plan detail. */
export function extractBenefitRows(d: MAPlanDetail): BenefitRow[] {
  const maRows = extractMaBenefitRows(d);

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

  const rows: BenefitRow[] = [...maRows];
  if (!Array.isArray(raw)) return rows;

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
  const genericGroups: { section: string; keys: string[] }[] = [
    { section: "Hearing", keys: ["hearing", "hearing_benefits", "hearingBenefits"] },
    { section: "Preventive dental", keys: ["preventive_dental", "preventiveDental", "dental_preventive"] },
    { section: "Comprehensive dental", keys: ["dental", "comprehensive_dental", "dental_benefits"] },
    { section: "Vision", keys: ["vision", "vision_benefits", "visionBenefits"] },
    { section: "More extra benefits", keys: ["extra_benefits", "additional_benefits_detail", "supplemental_benefits"] },
    { section: "Skilled nursing / DME / diabetes", keys: ["skilled_nursing", "dme", "diabetes", "durable_medical_equipment"] },
  ];

  for (const g of genericGroups) {
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

  const ab = pickDetail(d, ["abstract_benefits"]);
  if (ab && typeof ab === "object" && !Array.isArray(ab)) {
    out.push(...formatAbstractBenefits(ab as Record<string, unknown>));
  }

  const sb = pickDetail(d, ["additional_supplemental_benefits"]);
  if (sb && typeof sb === "object" && !Array.isArray(sb)) {
    out.push(...formatSupplementalBenefits(sb as Record<string, unknown>));
  }

  const pb = pickDetail(d, ["package_benefits"]);
  if (pb && typeof pb === "object" && !Array.isArray(pb)) {
    out.push(...formatPackageBenefits(pb as Record<string, unknown>));
  }

  const opt = pickDetail(d, ["optional_benefits", "optionalBenefits"]);
  if (Array.isArray(opt)) {
    out.push(...formatOptionalBenefits(opt));
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
  if (v !== undefined) return cellString(v, 600);

  const ab = pickDetail(d, ["abstract_benefits"]);
  if (ab && typeof ab === "object" && !Array.isArray(ab)) {
    const rows = formatAbstractBenefits(ab as Record<string, unknown>);
    if (rows.length) return rows.map((r) => `${r.label}:\n${r.text}`).join("\n\n");
  }
  return "";
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

const PHARMACY_COST_ARRAY_KEYS = [
  "pharmacies",
  "pharmacy_costs",
  "pharmacyCosts",
  "estimated_pharmacy_costs",
  "estimatedPharmacyCosts",
  "drug_costs_by_pharmacy",
  "drugCostsByPharmacy",
  "pharmacy_drug_costs",
  "pharmacyDrugCosts",
  "rx_pharmacy_costs",
  "prescription_pharmacy_costs",
  "plan_pharmacy_costs",
];

/** Medicare sometimes nests store info under `pharmacy` / `pharmacy_info`. */
function flattenPharmacyCostObject(o: Record<string, unknown>): Record<string, unknown> {
  const nested = (o.pharmacy ?? o.pharmacy_info ?? o.pharmacyInfo) as unknown;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const n = nested as Record<string, unknown>;
    const next = { ...o };
    if (next.pharmacy_name == null && next.name == null) {
      next.pharmacy_name = n.name ?? n.pharmacy_name ?? n.organization_name ?? n.store_name;
    }
    if (next.npi == null) next.npi = n.npi ?? n.pharmacy_npi;
    return next;
  }
  return o;
}

/** True if object looks like a pharmacy row (not a formulary drug row). */
function itemLooksLikePharmacyCostRow(o: Record<string, unknown>): boolean {
  const rawCost =
    o.estimated_annual_cost ?? o.estimated_cost ?? o.total_cost ?? o.cost ?? o.total ?? o.annual_drug_cost ??
    o.remaining_premium_and_drugs ?? o.remaining_premium_and_drugs_retail ?? o.remaining_premium_and_drugs_mail_order ??
    o.annual_drugs_total ?? o.annual_drugs_total_retail ?? o.annual_drugs_total_mail_order;
  const hasCost =
    rawCost !== undefined &&
    rawCost !== null &&
    String(rawCost).trim() !== "" &&
    !(typeof rawCost === "number" && !Number.isFinite(rawCost));
  if (!hasCost) return false;
  const hasPharmacySignal =
    o.pharmacy_name != null ||
    o.pharmacy != null ||
    o.preferred_pharmacy != null ||
    o.pharmacy_npi != null ||
    o.pharmacy_type != null ||
    (o.npi != null && (o.network_tier != null || o.tier != null));
  if (hasPharmacySignal) return true;
  // Search API sometimes uses store name in `name` plus network/tier fields only
  if (
    o.name != null &&
    String(o.name).trim() &&
    (o.network_tier != null || o.tier != null || o.network_status != null)
  ) {
    return true;
  }
  return false;
}

/** Parse Medicare-style array of per-pharmacy cost objects. */
export function parsePharmacyCostArray(c: unknown, strictPharmacyShape = false): PharmacyCostRow[] {
  if (!Array.isArray(c)) return [];
  const rows: PharmacyCostRow[] = [];
  for (const item of c) {
    if (!item || typeof item !== "object") continue;
    const o = flattenPharmacyCostObject(item as Record<string, unknown>);
    if (strictPharmacyShape && !itemLooksLikePharmacyCostRow(o)) continue;
    const name = String(o.pharmacy_name ?? o.name ?? o.pharmacy ?? "Pharmacy");
    const tier = String(o.network_tier ?? o.tier ?? o.network_status ?? o.pharmacy_type ?? "");
    const rawCost =
      o.estimated_annual_cost ?? o.estimated_cost ?? o.total_cost ?? o.cost ?? o.total ??
      o.remaining_premium_and_drugs ?? o.remaining_premium_and_drugs_retail ?? o.remaining_premium_and_drugs_mail_order ??
      o.annual_drugs_total ?? o.annual_drugs_total_retail ?? o.annual_drugs_total_mail_order ?? 0;
    const cost = typeof rawCost === "number" ? rawCost : parseFloat(String(rawCost).replace(/[,$]/g, "")) || 0;
    rows.push({
      pharmacyName: name,
      networkTier: tier && tier !== "undefined" ? tier : "",
      estimatedAnnualCost: cost,
    });
  }
  return rows;
}

/** Structured per-pharmacy cost rows from plan search response. */
export function extractPharmacyCostTable(plan: MAPlan | PDPPlan): PharmacyCostRow[] {
  const p = plan as unknown as Record<string, unknown>;
  for (const key of PHARMACY_COST_ARRAY_KEYS) {
    const c = p[key];
    const rows = parsePharmacyCostArray(c, false);
    if (rows.length) return rows;
  }
  return [];
}

/**
 * Same as extractPharmacyCostTable but reads plan-detail JSON (GET /plan/...).
 * Medicare often omits per-pharmacy arrays from search results; detail sometimes includes them under different keys.
 */
export function extractPharmacyCostTableFromDetail(d: MAPlanDetail | undefined | null): PharmacyCostRow[] {
  if (!d || typeof d !== "object") return [];
  for (const key of PHARMACY_COST_ARRAY_KEYS) {
    const c = pickDetail(d, [key]);
    const rows = parsePharmacyCostArray(c, true);
    if (rows.length) return rows;
  }
  for (const [key, val] of Object.entries(d as Record<string, unknown>)) {
    if (!/pharmacy|drug.*cost|rx.*cost|estimated.*drug/i.test(key)) continue;
    const rows = parsePharmacyCostArray(val, true);
    if (rows.length) return rows;
  }
  return [];
}

function toPositiveNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v) && v > 0) return v;
  if (typeof v === "string" && v.trim()) {
    const n = parseFloat(v.replace(/[,$]/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

/** When Medicare omits per-pharmacy rows, surface plan-level estimates from search results. */
function syntheticPharmacyRowsFromPlan(plan: MAPlan | PDPPlan): PharmacyCostRow[] {
  const p = plan as unknown as Record<string, unknown>;
  const rem = toPositiveNumber(p.remaining_premium_and_drugs);
  if (rem != null) {
    return [
      {
        pharmacyName: "Total premium + drugs (est. annual)",
        networkTier: "",
        estimatedAnnualCost: rem,
      },
    ];
  }
  const ann = toPositiveNumber(p.annual_drugs_total);
  if (ann != null) {
    return [
      {
        pharmacyName: "Estimated drug cost (annual)",
        networkTier: "",
        estimatedAnnualCost: ann,
      },
    ];
  }
  const retail = toPositiveNumber(p.remaining_premium_and_drugs_retail ?? p.annual_drugs_total_retail);
  const mail = toPositiveNumber(p.remaining_premium_and_drugs_mail_order ?? p.annual_drugs_total_mail_order);
  const out: PharmacyCostRow[] = [];
  if (retail != null) {
    out.push({
      pharmacyName: "Retail / standard pharmacy (est. annual)",
      networkTier: "",
      estimatedAnnualCost: retail,
    });
  }
  if (mail != null) {
    out.push({
      pharmacyName: "Mail order (est. annual)",
      networkTier: "",
      estimatedAnnualCost: mail,
    });
  }
  return out;
}

/** Prefer search payload, then plan-detail (full comparison fetches both). */
export function mergePharmacyCostTables(
  plan: MAPlan | PDPPlan,
  detail: MAPlanDetail | undefined | null
): PharmacyCostRow[] {
  const fromSearch = extractPharmacyCostTable(plan);
  if (fromSearch.length > 0) return fromSearch;
  const fromDetail = extractPharmacyCostTableFromDetail(detail ?? undefined);
  if (fromDetail.length > 0) return fromDetail;
  return syntheticPharmacyRowsFromPlan(plan);
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
