# Cursor Prompt: MAPD & PDP Plan Comparison — Full Medicare.gov Parity

## Goal

Upgrade both the **Medicare Advantage (MAPD)** and **Prescription Drug Plan (PDP)** comparison experiences in the Golden Age Quoting tool to match Medicare.gov's plan comparison page feature-for-feature. This prompt covers gaps identified by comparing every field Medicare.gov displays against what our tool currently shows.

---

## PART 1: MAPD COMPARISON GAPS & FIXES

The existing `MACompareModal.tsx` already has 6 sections (Overview, Plan Features, Benefits & Costs, Extra Benefits, Drug Coverage, Cost Sharing). However, several fields are **missing or incomplete** compared to Medicare.gov.

### Gap 1A: Missing Plan Features in Boolean Grid

**Medicare.gov shows 17 boolean features.** Our tool shows 7 static + dynamic from plan detail. The following features are **missing from the static list** and should be added:

| Feature Medicare.gov Shows | Currently in Our Tool? | Fix |
|---|---|---|
| Vision | ✅ Yes | — |
| Dental | ✅ Yes | — |
| Hearing | ✅ Yes | — |
| Transportation | ✅ Yes | — |
| Fitness benefits | ✅ Yes | — |
| Telehealth | ✅ Yes | — |
| OTC drug benefits | ✅ Yes | — |
| **Worldwide emergency** | ❌ No | Add to static list |
| **In-home support services** | ❌ No | Add to static list |
| **Personal Emergency Response System (PERS)** | ❌ No | Add to static list |
| **Routine chiropractic service** | ❌ No | Add to static list |
| **Home and bathroom safety devices** | ❌ No | Add to static list |
| **Part B premium reduction (feature flag)** | ❌ No (only in Overview as dollar amount) | Add as boolean |
| **Meals for short duration** | ❌ No | Add to static list |
| **Annual physical exams** | ❌ No | Add to static list |
| **Endodontics** | ❌ No | Add to static list |
| **Periodontics** | ❌ No | Add to static list |

**Implementation in `MACompareModal.tsx`:**

In the `planFeatureRows` useMemo, expand the `staticLabels` array. The data for these features comes from the **plan detail API response** — specifically nested in the `plan_features`, `additional_benefits`, or `benefit_package` objects. The `extractFeatureMap()` function in `maPlanDetailParse.ts` already tries to parse these dynamically, but we should add explicit lookups to ensure they appear even when the API uses non-standard keys.

**Implementation in `maPlanDetailParse.ts`:**

Update `extractFeatureMap()` to look for these specific keys in the plan detail response:

```typescript
// After the dynamic parsing, add explicit fallback lookups:
const explicitKeys: [string, string[]][] = [
  ["Worldwide emergency", ["worldwide_emergency", "worldwideEmergency", "emergency_worldwide"]],
  ["In-home support services", ["in_home_support", "inHomeSupport", "home_support_services"]],
  ["Personal Emergency Response System (PERS)", ["pers", "personal_emergency_response", "personalEmergencyResponse"]],
  ["Routine chiropractic service", ["chiropractic", "routine_chiropractic", "chiropracticService"]],
  ["Home and bathroom safety devices", ["home_safety_devices", "homeBathroomSafety", "bathroom_safety"]],
  ["Meals for short duration", ["meals", "meals_short_duration", "mealsBenefit"]],
  ["Annual physical exams", ["annual_physical", "annualPhysicalExam", "physical_exam"]],
  ["Endodontics", ["endodontics", "endodonticServices"]],
  ["Periodontics", ["periodontics", "periodonticServices"]],
];

for (const [label, keys] of explicitKeys) {
  if (m.has(label)) continue;
  const v = pickDetail(d, keys);
  if (v !== undefined) trySet(label, v);
}
```

**Also add to `MAPlan` type or derive from plan detail:** Some of these (worldwide_emergency, chiropractic, pers, etc.) may be available in the search results too. Check the `/plans/search` response for each — if present, add to the `MAPlan` type in `src/types/index.ts` and use directly. If not, rely on the plan detail response.

### Gap 1B: Benefits & Costs — Missing Rows

**Medicare.gov shows 11 specific benefit/cost categories.** Our tool dynamically parses whatever the plan detail returns, but we should ensure these specific categories always appear (even if showing "—" when absent):

| Benefit Row | Present in Our Tool? |
|---|---|
| Primary doctor visit | ✅ Yes (from cost_sharing in search) |
| Specialist visit | ✅ Yes (from cost_sharing in search) |
| **Diagnostic tests & procedures** | ⚠️ Only if plan detail returns it |
| **Lab services** | ⚠️ Only if plan detail returns it |
| **Diagnostic radiology (MRI)** | ⚠️ Only if plan detail returns it |
| **Outpatient x-rays** | ⚠️ Only if plan detail returns it |
| **Emergency care** | ⚠️ Only if plan detail returns it |
| **Urgent care** | ⚠️ Only if plan detail returns it |
| **Inpatient hospital coverage** | ⚠️ Only if plan detail returns it |
| **Outpatient hospital coverage** | ⚠️ Only if plan detail returns it |
| **Preventive services** | ⚠️ Only if plan detail returns it |

**Fix:** Add a `REQUIRED_BENEFIT_KEYS` constant in `maPlanDetailParse.ts` that maps each of the 11 Medicare.gov benefit categories to possible API key names. In `extractBenefitRows()`, after dynamic extraction, ensure each required key exists in the output (insert with "—" if missing). This guarantees consistent comparison rows across plans.

```typescript
export const REQUIRED_BENEFIT_KEYS: { key: string; label: string; apiKeys: string[] }[] = [
  { key: "primary doctor visit", label: "Primary doctor visit", apiKeys: ["primary_care", "primaryCare", "primary_doctor"] },
  { key: "specialist visit", label: "Specialist visit", apiKeys: ["specialist", "specialistVisit", "specialist_care"] },
  { key: "diagnostic tests & procedures", label: "Diagnostic tests & procedures", apiKeys: ["diagnostic_tests", "diagnosticTests", "diagnostic_procedures"] },
  { key: "lab services", label: "Lab services", apiKeys: ["lab_services", "labServices", "laboratory"] },
  { key: "diagnostic radiology", label: "Diagnostic radiology (MRI)", apiKeys: ["diagnostic_radiology", "radiology", "mri"] },
  { key: "outpatient x-rays", label: "Outpatient x-rays", apiKeys: ["outpatient_xray", "xrays", "outpatient_x_rays"] },
  { key: "emergency care", label: "Emergency care", apiKeys: ["emergency_care", "emergencyCare", "emergency"] },
  { key: "urgent care", label: "Urgent care", apiKeys: ["urgent_care", "urgentCare"] },
  { key: "inpatient hospital", label: "Inpatient hospital coverage", apiKeys: ["inpatient", "inpatient_hospital", "inpatientHospital"] },
  { key: "outpatient hospital", label: "Outpatient hospital coverage", apiKeys: ["outpatient", "outpatient_hospital", "outpatientHospital"] },
  { key: "preventive services", label: "Preventive services", apiKeys: ["preventive", "preventive_services", "preventiveCare"] },
];
```

### Gap 1C: Extra Benefits — Missing Subcategories

**Medicare.gov breaks Extra Benefits into specific sub-sections:**

1. **Hearing:**
   - Prescription hearing aids (copay)
   - Over-the-counter hearing aids (covered/not covered)

2. **Preventive Dental:**
   - Oral exams
   - Dental X-rays
   - Cleaning

3. **Comprehensive Dental:**
   - Restorative services
   - Periodontics
   - Oral and maxillofacial surgery

4. **More Extra Benefits:**
   - Eyeglasses (frames & lenses)
   - Skilled nursing facility (tiered: per day for days X-Y)
   - Durable medical equipment (DME)
   - Diabetes supplies

**Our tool** currently uses `extractExtraSections()` which only looks for top-level keys (dental, vision, hearing, dme, diabetes, skilled_nursing). These are displayed as single text blobs.

**Fix:** Expand `extractExtraSections()` to produce **nested rows** for each subcategory. Instead of returning `{ title, text }[]`, return a structure like:

```typescript
type ExtraSection = {
  title: string;
  subtitle?: string;
  rows: { label: string; values: string[] }[];
};
```

Then in `MACompareModal.tsx`, render each extra section with sub-section headers and individual rows — matching Medicare.gov's structure.

### Gap 1D: In-Network vs Out-of-Network Display

**Medicare.gov shows both In-network AND Out-of-network costs for PPO plans** on every benefit row. Our tool currently only shows in-network values.

**Fix:** When rendering benefit/cost rows, check if the plan is a PPO type (`plan.category` contains "PPO" or "REGIONAL_PPO"). If so, look for out-of-network values in the plan detail response (keys like `out_of_network`, `oon_cost`, `outOfNetwork`) and display them below the in-network value:

```
In-network: $45 copay
Out-of-network: 40% coinsurance
```

### Gap 1E: Inpatient Hospital — Tiered Display

**Medicare.gov shows inpatient hospital coverage as tiered:**
```
$325 per day for days 1-6
$0 per day for days 7-90
$0 per stay
```

**Our tool** shows this as a flat text string from plan detail.

**Fix:** Parse the inpatient tier structure from the plan detail response. Look for arrays with `per_day` amounts and `day_range` fields. Format them as a multi-line display with clear tier labels.

### Gap 1F: Drug Coverage — Pharmacy-Level Breakdown

**Medicare.gov shows estimated total drug + premium cost broken down by pharmacy:**
```
GUARDIAN PHARMACY — Out-of-network — $1,137.96
BRIGHTON RX PHARMACY — In-network — $1,079.19
MEIJER PHARMACY #046 — Preferred In-network — $1,086.39
Mail order pharmacy — Preferred In-network — $1,031.94
```

**Our tool** currently shows a single "Pharmacy / drug summary" text blob from `extractDrugSection()`.

**Fix:** This data comes from the **search response** `estimated_drug_costs` or similar field (populated when user enters drugs + pharmacies in the wizard). When pharmacy-level costs are available:
1. Parse into an array of `{ pharmacyName, networkTier, estimatedCost }`
2. Display as a mini-table within each plan column
3. If no pharmacy data available, show the aggregate estimate or "Add drugs for estimates"

---

## PART 2: PDP COMPARISON — BUILD FROM SCRATCH

**Currently:** PDPResults.tsx has a simple inline table showing plan name, org, premium, deductible, est. drug cost, and stars. **No modal comparison exists.**

**Medicare.gov's PDP comparison shows:**

### Section 1: Header (per plan column)
- Plan name
- Monthly premium
- "Monthly premium" label
- Enroll + Plan Details buttons

### Section 2: Overview
| Row | Description |
|-----|-------------|
| Star rating | 1–5 stars (visual) |
| Total monthly premium | Drug premium only |
| Yearly drug deductible | e.g., $615.00 |

### Section 3: Drug Coverage & Costs
- **Drugs covered / Not covered** — shows count of user's entered drugs that are covered
- **Estimated total drug + premium cost** — broken down by pharmacy (same pharmacy-level breakdown as MAPD)
- **"Add your prescription drugs" prompt** if no drugs entered

### Implementation Plan for PDP Comparison

#### Step 1: Create `PDPCompareModal.tsx`

Model after `MACompareModal.tsx` but simpler — PDP has no medical benefits, no extra benefits, no plan features grid.

**Component structure:**
```
PDPCompareModal
├── Header: plan names + monthly premium
├── Section: Overview (star rating, premium, deductible)
├── Section: Drug Coverage & Costs
│   ├── Drugs covered / not covered (if drugs entered)
│   ├── Per-pharmacy cost breakdown (if pharmacies selected)
│   └── "Add drugs for estimates" prompt (if no drugs)
└── Footer: Print + Save as PDF + Close
```

**Props:**
```typescript
interface PDPCompareModalProps {
  open: boolean;
  onClose: () => void;
  plans: PDPPlan[];
  planDetails: PDPPlanDetail[];  // New type (may be same structure)
  zip: string;
  pharmacyCosts?: PharmacyCostBreakdown[];  // Per-plan pharmacy costs if available
}
```

#### Step 2: Create `PDPPlanDetail` Type

In `src/types/index.ts`, add:

```typescript
/** PDP plan detail from Medicare.gov plan detail API.
 *  Uses same endpoint as MAPD: GET /plan/{year}/{contract_id}/{plan_id}/{segment_id}
 *  Typed as Record to handle variable schema — same pattern as MAPlanDetail */
export type PDPPlanDetail = Record<string, unknown>;
```

The plan detail API endpoint (`/api/plan-detail`) already works for PDP plans — it uses the same `GET /plan/{year}/{contract_id}/{plan_id}/{segment_id}` pattern, and PDPPlan has `contract_id`, `plan_id`, `segment_id` fields.

#### Step 3: Update `quoteProvider.ts`

Add a PDP detail fetch function (or make the existing one generic):

```typescript
export async function fetchPDPPlanDetail(
  year: string,
  contractId: string,
  planId: string,
  segmentId: string
): Promise<PDPPlanDetail> {
  const res = await fetch(
    `/api/plan-detail?year=${year}&contract_id=${contractId}&plan_id=${planId}&segment_id=${segmentId}`
  );
  if (!res.ok) throw new Error(`PDP plan detail failed: ${res.status}`);
  return res.json();
}
```

Alternatively, make the existing `fetchPlanDetail()` generic by accepting a type parameter.

#### Step 4: Create `pdpPlanDetailParse.ts`

Create `src/lib/pdpPlanDetailParse.ts` with parsing helpers specific to PDP data:

```typescript
import type { PDPPlanDetail } from "@/types";
import { pickDetail, cellString } from "./maPlanDetailParse";

/** Extract drug formulary coverage info from PDP plan detail */
export function extractDrugFormulary(d: PDPPlanDetail): {
  tieredCosts?: { tier: string; cost: string }[];
  gapCoverage?: string;
  catastrophicCoverage?: string;
} {
  // Parse drug tier structure: preferred generic, generic, preferred brand,
  // non-preferred brand, specialty
  const tiers = pickDetail(d, ["drug_tiers", "drugTiers", "formulary_tiers", "drug_costs"]);
  // Parse gap (donut hole) coverage
  const gap = pickDetail(d, ["gap_coverage", "gapCoverage", "coverage_gap", "donut_hole"]);
  // Parse catastrophic coverage
  const catastrophic = pickDetail(d, ["catastrophic_coverage", "catastrophicCoverage"]);

  return {
    tieredCosts: Array.isArray(tiers)
      ? tiers.map(t => ({ tier: cellString(t.name ?? t.tier), cost: cellString(t.cost ?? t.copay) }))
      : undefined,
    gapCoverage: gap ? cellString(gap) : undefined,
    catastrophicCoverage: catastrophic ? cellString(catastrophic) : undefined,
  };
}

/** Extract pharmacy network details */
export function extractPharmacyDetails(d: PDPPlanDetail): {
  mailOrder90Day?: boolean;
  preferredPharmacyNetwork?: boolean;
} {
  return {
    mailOrder90Day: pickDetail(d, ["mail_order", "mailOrder", "mail_order_pharmacy"]) as boolean | undefined,
    preferredPharmacyNetwork: pickDetail(d, ["preferred_pharmacy", "preferredPharmacy"]) as boolean | undefined,
  };
}
```

#### Step 5: Integrate into `PDPResults.tsx`

Update the existing PDP results component:

1. **Add comparison modal trigger:**
   - Keep existing checkbox selection (already allows unlimited — should limit to 3 max like MAPD)
   - Add a **"Full Comparison (N)" button** next to the existing inline table
   - When clicked: fetch plan details for each selected plan, show loading spinner, then open `PDPCompareModal`

2. **Limit selection to 3 plans max** (match Medicare.gov behavior)

3. **Pass pharmacy/drug data through:**
   - If user entered drugs in wizard step 1, pass the drug coverage data to the modal
   - If user selected pharmacies in wizard step 2, pass pharmacy cost breakdowns

**Code changes in PDPResults.tsx:**

```typescript
// Add state for modal
const [compareOpen, setCompareOpen] = useState(false);
const [pdpDetails, setPdpDetails] = useState<PDPPlanDetail[]>([]);
const [loadingDetails, setLoadingDetails] = useState(false);

// Add handler to fetch details and open modal
const openFullComparison = async () => {
  setLoadingDetails(true);
  try {
    const details = await Promise.all(
      comparedPlans.map(p =>
        fetchPDPPlanDetail(String(p.contract_year), p.contract_id, p.plan_id, p.segment_id)
      )
    );
    setPdpDetails(details);
    setCompareOpen(true);
  } catch (err) {
    console.error("Failed to load PDP plan details:", err);
  } finally {
    setLoadingDetails(false);
  }
};
```

---

## PART 3: SEARCH RESULTS CARD IMPROVEMENTS (BOTH MAPD & PDP)

### Gap 3A: PDP Search Result Cards — Missing Fields

**Medicare.gov PDP search card shows:**
- Plan name + Plan ID
- Organization name
- Star rating (visual)
- Monthly premium
- "Includes: Only drug coverage" label
- Total drug & premium cost (for rest of year)
- Deductible
- Pharmacies section ("Add your drugs & pharmacies")
- Drugs section ("Add your prescription drugs")
- Enroll button + Plan Details button
- Add to compare checkbox

**Our PDP card currently shows:**
- Plan name + star rating
- Organization + contract ID
- Monthly premium
- Deductible
- Estimated total annual cost (if drugs added)
- Carrier website link

**Missing from our PDP cards:**
1. Plan ID display (e.g., "S4802-084-0") — easy add
2. "Includes: Only drug coverage" label
3. Pharmacies section with network status per pharmacy
4. Separate "Drugs" section showing coverage status per drug
5. Enroll + Plan Details buttons (we only have carrier link)

### Gap 3B: MAPD Search Result Cards — Minor Gaps

**Medicare.gov MAPD search card shows:**
- Copays/Coinsurance section: Primary doctor copay, Specialist copay
- "See more benefits" expandable link showing additional plan features

**Our MAPD cards already show** copay ranges and benefit badges. Minor additions:
1. Add "See more benefits" expandable section for the extra features list
2. Show Plan ID prominently (e.g., "H2354-015-0")

### Gap 3C: Filters — PDP Missing Filters

**Medicare.gov PDP filters:** Insurance Carriers, Star Ratings
**Medicare.gov MAPD filters:** Health Plan Type, Plan Benefits, Insurance Carriers, Drug Coverage, Star Ratings

**Our tool:** No filter UI on either MAPD or PDP results.

**Fix:** Add filter dropdowns above the plan cards list. For MAPD:
- Health Plan Type: HMO, PPO (checkbox filter on `plan.category`)
- Plan Benefits: Vision, Dental, Hearing, Transportation, Fitness (checkbox filter on `plan.package_services`)
- Insurance Carriers: Dynamic list from results (checkbox filter on `plan.organization_name`)
- Drug Coverage: Includes/Doesn't include (filter on `plan.plan_type === "PLAN_TYPE_MAPD"`)
- Star Ratings: 5,4,3,2,1,No rating (filter on `plan.overall_star_rating.rating`)

For PDP:
- Insurance Carriers (checkbox filter)
- Star Ratings (checkbox filter)

### Gap 3D: Sort Options

**Medicare.gov MAPD sort options:**
- Lowest yearly drug deductible
- Lowest health plan deductible
- Lowest drug + premium cost
- Lowest monthly premium

**Our MAPD sort options:**
- By monthly premium (ascending)
- By star rating (descending)
- By estimated total cost (ascending, when drugs added)

**Missing:** "Lowest health plan deductible" sort option.

**Medicare.gov PDP sort options:**
- Lowest drug + premium cost
- (implied) Lowest monthly premium

**Our PDP sort options:**
- By monthly premium
- By deductible
- By star rating
- By estimated total cost

Our PDP sorting is actually quite good — no major gaps.

---

## PART 4: CROSS-CUTTING IMPROVEMENTS

### 4A: "View Additional Benefits" Link in Comparison

Medicare.gov's Plan Features section in the comparison has a "View additional benefits" link per plan that navigates to the full plan detail page. We should add a link to the carrier's website or Medicare.gov plan detail page for each plan in the comparison modal.

### 4B: Print Optimization

Both comparison modals should support clean printing. The existing `MACompareModal` already has `print:` Tailwind classes and a `life-compare-no-print` class. Ensure the new `PDPCompareModal` follows the same pattern.

### 4C: Plan Detail Response Logging

**Critical for debugging:** When fetching plan details (both MAPD and PDP), log the full API response to the browser console on first load. This helps identify new/changed field names in the Medicare.gov API. Add:

```typescript
if (process.env.NODE_ENV === 'development') {
  console.log(`Plan detail for ${contractId}-${planId}-${segmentId}:`, detail);
}
```

---

## FILE REFERENCE

| File | Action |
|------|--------|
| `src/components/MACompareModal.tsx` | **MODIFY** — Add missing plan features, benefit rows, OON display, inpatient tiers, pharmacy breakdown |
| `src/lib/maPlanDetailParse.ts` | **MODIFY** — Add explicit feature key lookups, required benefit keys, extra benefit subcategories |
| `src/components/PDPResults.tsx` | **MODIFY** — Add max 3 selection, "Full Comparison" button, modal integration, plan ID display |
| `src/components/PDPCompareModal.tsx` | **CREATE** — New PDP comparison modal |
| `src/lib/pdpPlanDetailParse.ts` | **CREATE** — New PDP detail parsing helpers |
| `src/types/index.ts` | **MODIFY** — Add PDPPlanDetail type, add missing fields to MAPlan if available from search |
| `src/providers/quoteProvider.ts` | **MODIFY** — Add fetchPDPPlanDetail() or make fetchPlanDetail generic |
| `src/components/MAResults.tsx` | **MODIFY** — Add filter dropdowns, plan ID display, "See more benefits" expandable |

---

## IMPLEMENTATION ORDER

1. **MAPD Plan Features expansion** (Gap 1A) — Quick win, expand static labels + maPlanDetailParse
2. **MAPD Benefits & Costs required rows** (Gap 1B) — Ensure consistent row display
3. **MAPD Extra Benefits subcategories** (Gap 1C) — Structured dental/vision/hearing breakdown
4. **MAPD In-Network / Out-of-Network** (Gap 1D) — PPO-specific dual display
5. **MAPD Inpatient tiered display** (Gap 1E) — Parse tier structure
6. **MAPD Drug coverage pharmacy breakdown** (Gap 1F) — Per-pharmacy cost table
7. **PDP Compare Modal creation** (Part 2) — Full new component
8. **PDP detail fetch + parse** (Part 2, Steps 2-4) — Provider + types + parser
9. **PDP Results integration** (Part 2, Step 5) — Wire up modal
10. **Filter dropdowns** (Gap 3C) — MAPD + PDP search filters
11. **Plan ID + minor card improvements** (Gaps 3A, 3B) — Quick UI polish

---

## WHAT NOT TO DO

- Do NOT call Medicare.gov directly from the browser — all calls through our API routes → Render proxy
- Do NOT create separate comparison pages — use modal overlays (consistent with existing pattern)
- Do NOT hardcode benefit categories — parse from API response dynamically, but ensure Medicare.gov's categories always appear
- Do NOT fetch plan details on page load — only fetch when user clicks "Full Comparison"
- Do NOT remove the existing inline comparison tables — keep them as quick-glance summary
- Do NOT modify the existing `MACompareModal` architecture (portal-based) — extend it
- Do NOT break the existing drug/pharmacy/provider wizard flow — comparison enhancements layer on top

---

## SUMMARY OF DELIVERABLES

### New Files
1. `src/components/PDPCompareModal.tsx` — PDP full comparison modal
2. `src/lib/pdpPlanDetailParse.ts` — PDP plan detail parsing helpers

### Modified Files
3. `src/components/MACompareModal.tsx` — 10 additional plan features, 11 required benefit rows, OON display, tiered inpatient, pharmacy breakdown
4. `src/lib/maPlanDetailParse.ts` — Explicit feature key lookups, required benefit constants, extra benefit subcategories
5. `src/components/PDPResults.tsx` — Max 3 selection, "Full Comparison" button, modal integration
6. `src/components/MAResults.tsx` — Filter dropdowns, plan ID display
7. `src/types/index.ts` — PDPPlanDetail type, potential new MAPlan fields
8. `src/providers/quoteProvider.ts` — fetchPDPPlanDetail function
