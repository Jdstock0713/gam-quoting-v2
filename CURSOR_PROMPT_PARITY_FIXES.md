# Cursor Prompt: Parity Fixes — Golden Age Quoting vs. Medicare.gov

## Context

A live parity audit (March 25, 2026) compared our Golden Age Quoting tool against Medicare.gov's plan comparison pages. Overall parity is **78%** (MAPD 90%, PDP 72%, data accuracy 95%). This prompt addresses the **6 identified gaps** in priority order. Each gap includes the exact file(s) to modify, what Medicare.gov shows, and what to implement.

**Source of truth:** Medicare.gov plan comparison at `https://www.medicare.gov/medigap-supplemental-insurance-plans/`

---

## Gap 1: Per-Pharmacy Drug Cost Breakdown (HIGH PRIORITY)

**What Medicare.gov shows:** When a user enters drugs + selects pharmacies, the comparison view shows a per-pharmacy table inside each plan column with: pharmacy name, network tier (Preferred/Standard), and estimated total annual drug cost at that pharmacy.

**What we currently show:** `extractPharmacyBreakdownFromPlan()` in `maPlanDetailParse.ts` pulls pharmacy data from the search response, but displays it as a simplified summary rather than a structured per-pharmacy table.

### Files to modify:

1. **`src/lib/maPlanDetailParse.ts`** — Update `extractPharmacyBreakdownFromPlan()`:
   - The search API response (from POST `/plans/search`) includes a `pharmacies` or `pharmacy_costs` array per plan when drugs/pharmacies are in the request body
   - Each pharmacy entry has: `pharmacy_name`, `pharmacy_type` (or `network_tier`), `estimated_annual_cost` (or `total_cost`)
   - Return a structured array instead of a flat string: `{ pharmacyName: string; networkTier: string; estimatedAnnualCost: number }[]`
   - Add a new exported function `extractPharmacyCostTable(plan: MAPlan | PDPPlan): PharmacyCostRow[]` that parses these fields

2. **`src/components/MACompareModal.tsx`** — In the Drug Coverage & Costs section (around line 615-640):
   - Replace the flat pharmacy text with a mini-table per plan column
   - Each row: pharmacy name (left), network tier badge, cost (right-aligned, formatted as currency)
   - Sort by estimated cost ascending
   - Apply the existing `rowValuesDiffer` / amber highlight logic to the cost column

3. **`src/components/PDPCompareModal.tsx`** — In the Drug Coverage section (around line 131-146):
   - Same structured pharmacy table as MAPD
   - Use the shared `extractPharmacyCostTable()` function
   - PDP plans only have drug costs (no medical), so the pharmacy table is the primary cost comparison tool here

4. **`src/types/index.ts`** — Add type:
   ```typescript
   type PharmacyCostRow = {
     pharmacyName: string;
     networkTier: "Preferred" | "Standard" | "Non-preferred" | string;
     estimatedAnnualCost: number;
   };
   ```

### Visual reference (Medicare.gov layout):
```
Drug & premium costs by pharmacy
─────────────────────────────────
CVS Pharmacy (Preferred)        $1,245.00
Walgreens (Standard)            $1,890.00
Rite Aid (Standard)             $1,920.00
```

---

## Gap 2: "Drugs Covered / Not Covered" Count (HIGH PRIORITY)

**What Medicare.gov shows:** When drugs are entered, each plan column shows "X of Y drugs covered" with a green check for covered drugs and red X for uncovered drugs, listing each drug name.

**What we currently show:** A generic message like "2 drug(s) entered — see plan details for formulary" with no actual coverage check.

### Files to modify:

1. **`src/lib/maPlanDetailParse.ts`** — Add a new function:
   ```typescript
   export function extractDrugCoverageStatus(
     planDetail: MAPlanDetail,
     drugNames: string[]
   ): { drugName: string; covered: boolean; tier?: string; restrictions?: string }[]
   ```
   - The plan detail API response (GET `/plan/{year}/{contract}/{plan}/{segment}`) includes a `formulary` or `drug_coverage` section
   - Look for each entered drug name in the formulary data
   - Return coverage status per drug with tier info if available
   - If the formulary data isn't in the detail response, check if the search API response includes a `drugs_covered` or `covered_drugs` array

2. **`src/lib/pdpPlanDetailParse.ts`** — Add the same function for PDP plans:
   ```typescript
   export function extractPDPDrugCoverageStatus(
     planDetail: PDPPlanDetail,
     drugNames: string[]
   ): { drugName: string; covered: boolean; tier?: string; restrictions?: string }[]
   ```

3. **`src/components/MACompareModal.tsx`** — In the Drug Coverage section:
   - Add a "Drug Coverage" row at the top of the drug section
   - Show "X of Y drugs covered" as the summary
   - Below it, list each drug with ✓ (green) or ✗ (red) and tier info
   - The `drugNames` array should come from the wizard/search context (the drugs the user entered)

4. **`src/components/PDPCompareModal.tsx`** — Same implementation:
   - Replace the generic "X drug(s) entered" message with actual coverage status
   - This is especially important for PDP since drug coverage is the primary differentiator

### Visual reference (Medicare.gov layout):
```
Drugs covered: 2 of 3
  ✓ Metformin HCl 500mg (Tier 1)
  ✓ Lisinopril 10mg (Tier 1)
  ✗ Eliquis 5mg (Not covered)
```

---

## Gap 3: Enroll Button / Link (MEDIUM PRIORITY)

**What Medicare.gov shows:** A green "Enroll" button in each plan's column header that links to the carrier's enrollment page.

**What we currently show:** "Plan details →" link but no enrollment action.

### Files to modify:

1. **`src/components/MACompareModal.tsx`** — In the header section (where plan name and premium are rendered):
   - Add an "Enroll" button below the existing "Plan details →" link
   - Style: green background (`bg-green-600 hover:bg-green-700 text-white`), full-width within the column, rounded
   - The enrollment URL may be available in the plan search data as `enrollment_url` or can be constructed as: `https://www.medicare.gov/plan-compare/#/enroll?plan_id={contract_id}-{plan_id}-{segment_id}&year={year}&lang=en`
   - Open in a new tab (`target="_blank" rel="noopener noreferrer"`)

2. **`src/components/PDPCompareModal.tsx`** — Same enrollment button:
   - Same styling and placement as MAPD
   - Same URL construction logic

3. **`src/types/index.ts`** — Check if `MAPlan` and `PDPPlan` types include an `enrollment_url` field. If not, add it as optional:
   ```typescript
   enrollment_url?: string;
   ```

---

## Gap 4: Collapsible Accordion Sections (MEDIUM PRIORITY)

**What Medicare.gov shows:** Each comparison section (Overview, Plan Features, Benefits & Costs, etc.) can be collapsed/expanded by clicking the section header. This helps brokers focus on specific sections without scrolling through everything.

**What we currently show:** All sections are always visible; user must scroll through the entire modal.

### Files to modify:

1. **`src/components/MACompareModal.tsx`** — Add collapsible state per section:
   ```typescript
   const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
     overview: true,
     planFeatures: true,
     benefitsCosts: true,
     extraBenefits: true,
     drugCoverage: true,
   });

   const toggleSection = (key: string) =>
     setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
   ```
   - Wrap each section's content in a conditional render based on `expandedSections[key]`
   - Add a chevron icon (▼/▶) to each section header row that rotates on toggle
   - The section header row (the dark slate-gray row with the section name) becomes clickable
   - Add `cursor-pointer` and hover styles to section headers
   - Animate the collapse with a CSS transition (`max-height` + `overflow: hidden`) or use a simple conditional render

2. **`src/components/PDPCompareModal.tsx`** — Same accordion pattern:
   - PDP has fewer sections (Overview, Drug Coverage, Pharmacy/Tier Details) but should still be collapsible
   - Use the same `expandedSections` state pattern

### UX notes:
- Default all sections to **expanded** (matches Medicare.gov default behavior)
- Add a "Expand All / Collapse All" toggle link in the header bar next to Print/PDF buttons
- When printing, force all sections expanded via a `@media print` CSS rule

---

## Gap 5: Remove Plan from Comparison (X Button) (LOW PRIORITY)

**What Medicare.gov shows:** An X button in each plan column header to remove that plan from the comparison without closing the entire view.

**What we currently show:** No per-plan remove. User must close the modal and deselect the plan from the results list.

### Files to modify:

1. **`src/components/MACompareModal.tsx`**:
   - Add a small X button (absolute positioned, top-right of each plan column header)
   - Style: `text-gray-400 hover:text-red-500`, small (16px), with a subtle hover background
   - On click, call a callback prop like `onRemovePlan(planId: string)`
   - The parent component that manages the selected plans array should handle removing the plan
   - If only 1 plan remains after removal, either close the modal or show a message ("Select at least 2 plans to compare")
   - Don't show the X button if there are only 2 plans being compared (minimum for comparison)

2. **`src/components/PDPCompareModal.tsx`** — Same X button pattern

3. **Parent component** (wherever the comparison modal is rendered from):
   - Accept the `onRemovePlan` callback
   - Update the selected plans state to remove that plan
   - If plans drop below 2, close the modal

---

## Gap 6: Standard Part B Premium Display (LOW PRIORITY)

**What Medicare.gov shows:** "$202.90" as the Standard Part B premium reference for 2026 plans.

**What we currently show:** Attempts to read from plan detail API, falls back to "See Medicare.gov" if not found.

### Files to modify:

1. **`src/components/MACompareModal.tsx`** — In the Overview section where Standard Part B premium is rendered:
   - Add a hardcoded fallback for the current year's Part B premium
   - The 2026 standard Part B premium is **$202.90**
   - Update the logic: if the plan detail API returns a Part B premium value, use it; otherwise fall back to the known constant
   ```typescript
   const STANDARD_PART_B_PREMIUM: Record<number, number> = {
     2025: 185.00,
     2026: 202.90,
   };

   // In the overview rows:
   const partBPremium = extractPartBPremium(detail) ?? STANDARD_PART_B_PREMIUM[year] ?? null;
   ```
   - Only show "See Medicare.gov" if both the API value and the hardcoded fallback are unavailable (i.e., for a year we haven't mapped yet)

---

## Implementation Order

Implement these gaps in the following order to maximize value:

1. **Gap 4** (Collapsible accordion) — Low effort, high UX polish, no API work
2. **Gap 6** (Part B premium) — Trivial fix, improves data completeness
3. **Gap 3** (Enroll button) — Low effort, high broker workflow value
4. **Gap 5** (Remove plan X button) — Low effort, nice-to-have UX
5. **Gap 1** (Per-pharmacy drug costs) — Medium effort, requires verifying API response structure
6. **Gap 2** (Drugs covered count) — Medium effort, may require additional API investigation

---

## Testing Checklist

After implementing each gap, verify:

- [ ] **MAPD comparison** with 2-3 plans for ZIP 48116 (Livingston County MI) — all 6 sections render correctly
- [ ] **PDP comparison** with 2-3 plans for the same ZIP — overview, drug coverage, pharmacy details render
- [ ] **PPO plan** included in MAPD comparison — verify in-network / out-of-network rows still work
- [ ] **With drugs entered** (e.g., Metformin 500mg) — pharmacy cost table and drug coverage count display
- [ ] **Without drugs entered** — graceful fallback messages in drug sections
- [ ] **Accordion sections** — all collapse/expand; print forces all expanded
- [ ] **Remove plan (X)** — removes plan from view; handles minimum 2-plan constraint
- [ ] **Enroll button** — opens correct URL in new tab
- [ ] **Amber highlighting** — still works correctly on all new rows
- [ ] **Print / PDF** — all sections render in print view, accordion sections forced open
- [ ] **Mobile responsive** — horizontal scroll still works with new elements
