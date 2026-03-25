# Cursor Prompt: Medicare Advantage Plan Comparison Feature

## Goal

Upgrade the Medicare Advantage (MA/MAPD) plan comparison in the Golden Age Quoting tool to match the depth and layout of Medicare.gov's plan comparison page. Currently, `MAResults.tsx` has a basic inline comparison table showing only plan name, org, type, premium, drug deductible, est. drug cost, and stars. We need a **full-featured comparison modal** that mirrors what Medicare.gov shows when users click "Compare" on selected plans.

---

## What Medicare.gov's Comparison Shows

I reverse-engineered Medicare.gov's plan compare page (`#/compare-plans?plans=2026-H2354-015-0&plans=...&fips=26093`). The comparison view is organized into these sections, each as a row-based table with plans as columns:

### 1. Header (per plan column)
- Plan name (e.g., "HAP Medicare Connect (HMO)")
- Monthly premium (combined MA + drug)
- "Medicare Advantage and drug monthly premium" label
- Enroll button + Plan Details link

### 2. Overview Section
| Row | Description |
|-----|-------------|
| Star rating | 1–5 stars (visual stars display) |
| Health deductible | e.g., $0.00 |
| Drug plan deductible | e.g., $150.00 |
| Maximum you pay for health services | In-network amount; for PPO also Out-of-network amount |
| Health premium | Part C premium |
| Drug premium | Part D premium |
| Standard Part B premium | $202.90 (2026) |
| Part B premium reduction | "Not offered" or dollar amount |

### 3. Plan Features (boolean grid — checkmark ✓ or ✗)
| Feature | Notes |
|---------|-------|
| Vision | |
| Dental | |
| Hearing | |
| Transportation | |
| Fitness benefits | (SilverSneakers etc.) |
| Worldwide emergency | |
| Over-the-counter drug benefits | |
| In-home support services | |
| Personal Emergency Response System (PERS) | |
| Routine chiropractic service | |
| Home and bathroom safety devices | |
| Part B premium reduction | |
| Meals for short duration | |
| Annual physical exams | |
| Telehealth | |
| Endodontics | |
| Periodontics | |

### 4. Benefits & Costs
| Row | Example Value |
|-----|---------------|
| Primary doctor visit | In-network: $0 copay |
| Specialist visit | In-network: $45 copay |
| Diagnostic tests & procedures | In-network: $0–$150 copay |
| Lab services | In-network: $0 copay |
| Diagnostic radiology (MRI) | In-network: $0–$200 copay |
| Outpatient x-rays | In-network: $35 copay |
| Emergency care | $130 copay |
| Urgent care | $0–$45 copay |
| Inpatient hospital coverage | Tiered: $325/day days 1–6, $0/day days 7–90 |
| Outpatient hospital coverage | In-network: $0–$300 copay |
| Preventive services | In-network: $0 copay |

For PPO plans, each row also shows Out-of-network costs (e.g., "40% coinsurance").

### 5. Extra Benefits
- **Hearing**: Prescription hearing aids, OTC hearing aids
- **Preventive Dental**: Oral exams, Dental X-rays, Cleaning
- **Comprehensive Dental**: Restorative services, Periodontics, Oral/maxillofacial surgery
- **More extras**: Eyeglasses (frames & lenses), Skilled nursing facility, Durable medical equipment, Diabetes supplies

### 6. Drug Coverage & Costs
- Drugs covered / not covered (count of user's entered drugs)
- Total drug + premium cost broken down **by pharmacy** (shows each pharmacy name, network tier, and estimated cost)

---

## Architecture: How Medicare.gov Gets the Data

**Key finding: There is NO separate "compare" API endpoint.** The comparison page is built entirely from data already fetched by the plan search and plan detail APIs:

### Data Source 1: Plan Search (already implemented)
```
POST /api/v1/data/plan-compare/plans/search?plan_type=PLAN_TYPE_MAPD&year=2026&zip=48116&fips=26093&page=0
Body: {} or { npis, prescriptions }
```
Returns array of plan objects with the fields currently in our `MAPlan` type. This covers: premiums, deductibles, star ratings, basic benefits flags, cost-sharing for primary/specialist, drug costs.

### Data Source 2: Plan Detail (NOT yet implemented — MUST ADD)
```
GET /api/v1/data/plan-compare/plan/{year}/{contract_id}/{plan_id}/{segment_id}
```
Example: `GET /plan/2026/H2354/015/0`

This returns the **full plan detail** including ALL the comparison data fields (benefits & costs, extra benefits, inpatient tiers, dental/vision/hearing detail, etc.) that the search endpoint does NOT return.

**This is the critical missing piece.** The plan detail endpoint returns rich, nested data for every cost-sharing category, benefit limit, and coverage detail shown on the comparison page.

---

## Implementation Plan

### Step 1: Add Plan Detail API Route

Create `src/app/api/plan-detail/route.ts`:

```typescript
// GET /api/plan-detail?year=2026&contract_id=H2354&plan_id=015&segment_id=0
// Proxies to Medicare.gov: GET /plan/{year}/{contract_id}/{plan_id}/{segment_id}
```

Use the existing `medicareGet()` helper from `src/lib/medicare-proxy.ts`.

### Step 2: Add Plan Detail Fetcher to Provider Layer

In `src/providers/quoteProvider.ts`, add:

```typescript
export async function fetchPlanDetail(
  year: string,
  contractId: string,
  planId: string,
  segmentId: string
): Promise<MAPlanDetail> {
  const res = await fetch(
    `/api/plan-detail?year=${year}&contract_id=${contractId}&plan_id=${planId}&segment_id=${segmentId}`
  );
  if (!res.ok) throw new Error(`Plan detail failed: ${res.status}`);
  return res.json();
}
```

### Step 3: Create the `MAPlanDetail` Type

In `src/types/index.ts`, add a comprehensive `MAPlanDetail` type. You'll need to call the plan detail endpoint and inspect the response to get the exact field names. The response will include deeply nested objects for:

- `benefits` — array of benefit categories, each with cost-sharing details
- `drug_benefits` — drug tier cost-sharing
- `plan_features` — detailed boolean flags beyond what search returns
- `premium_info` — Part B reduction, premium breakdowns
- `moop` — maximum out-of-pocket details (in-network, out-of-network, combined)
- `snf` — skilled nursing facility tier details
- `inpatient` — inpatient hospital tiered cost-sharing
- `outpatient` — outpatient cost-sharing
- `dental`, `vision`, `hearing` — detailed coverage amounts and copays

**IMPORTANT**: Call the plan detail API first, log the full response JSON, then build the type from the actual response shape. Don't guess at field names.

### Step 4: Create `MACompareModal.tsx` Component

Build a new comparison modal component. Pattern it after the existing `LifeCompareModal.tsx` (portal-based modal with print/PDF support) but adapted for MA plan data.

**Component structure:**
```
MACompareModal
├── Header: plan names + monthly premium + Enroll/Details buttons
├── Section: Overview (star rating, deductibles, MOOP, premiums)
├── Section: Plan Features (boolean grid with ✓/✗)
├── Section: Benefits & Costs (copays/coinsurance per service)
├── Section: Extra Benefits (dental, vision, hearing, DME, SNF)
├── Section: Drug Coverage & Costs (pharmacy-level breakdown)
└── Footer: Print + Save as PDF + Close buttons
```

**Key UX details from Medicare.gov:**
- Plans are displayed as **columns** (up to 3 plans)
- Each benefit/cost row has a **label column** on the left and **plan values** in the remaining columns
- PPO plans show both In-network AND Out-of-network costs per row
- Sections are collapsible accordion-style with section headers
- Boolean features show green checkmark ✓ for available, red ✗ for not available
- Rows where values **differ across columns** should be highlighted (amber background) — we already do this in `LifeCompareModal.tsx`

**Props:**
```typescript
interface MACompareModalProps {
  plans: MAPlan[];           // Basic plan data from search
  planDetails: MAPlanDetail[]; // Detailed data fetched on modal open
  zip: string;
  fips: string;
  onClose: () => void;
}
```

### Step 5: Integrate into `MAResults.tsx`

Replace the current inline comparison table with:

1. Keep the checkbox selection for plans (already exists)
2. Add a **"Compare (N)" button** that opens the `MACompareModal`
3. When the button is clicked:
   - Fetch plan details for each selected plan using `fetchPlanDetail()`
   - Show a loading spinner while fetching
   - Open the modal once all details are loaded
4. Limit comparison to **3 plans max** (Medicare.gov's limit)
5. Show a disabled state on the Compare button if < 2 plans selected

### Step 6: Highlight Differences

Implement row-level highlighting (same pattern as `LifeCompareModal.tsx`):
- For each comparison row, check if all plan values are identical
- If values differ, apply amber/yellow background to that row
- If all values are the same, no highlight
- Add explanatory text: "Rows with differences are shaded"

---

## Existing Files to Reference

| File | Purpose |
|------|---------|
| `src/components/MAResults.tsx` | Current MA results + basic compare table — **modify this** |
| `src/components/LifeCompareModal.tsx` | Reference for modal pattern, row highlighting, print/PDF |
| `src/components/LifeInsuranceResults.tsx` | Reference for `compareSnapshotId()` pattern and sidebar |
| `src/types/index.ts` | Add `MAPlanDetail` type here |
| `src/providers/quoteProvider.ts` | Add `fetchPlanDetail()` here |
| `src/lib/medicare-proxy.ts` | Existing proxy helper — use `medicareGet()` for plan detail |
| `src/app/api/plans-search/route.ts` | Reference for API route pattern |

---

## Key Technical Details

### Medicare.gov API for Plan Detail
- **Base URL**: `https://www.medicare.gov/api/v1/data/plan-compare`
- **Endpoint**: `GET /plan/{year}/{contract_id}/{plan_id}/{segment_id}`
- **Example**: `GET /plan/2026/H2354/015/0`
- **Required headers** (handled by proxy): `User-Agent`, `Accept: */*`, `Fe-Ver: 2.64.0`, `Referer`, `Origin`
- **Proxy**: All calls go through Render.com proxy via `MEDICARE_PROXY_URL` env var (Vercel IPs are blocked by Medicare.gov)

### Plan ID Decomposition
The `MAPlan` type already has `contract_id`, `plan_id`, `segment_id`, and `contract_year` fields. Use these to construct the plan detail API call:
```typescript
const { contract_year, contract_id, plan_id, segment_id } = plan;
// → GET /plan/2026/H2354/015/0
```

### Medicare.gov Compare URL Pattern (for reference)
```
https://www.medicare.gov/plan-compare/#/compare-plans
  ?plans=2026-H2354-015-0
  &plans=2026-H2354-028-0
  &plans=2026-H2322-011-0
  &fips=26093
  &year=2026
  &lang=en
```
Plan ID format in URL: `{year}-{contractId}-{planId}-{segmentId}`

---

## What NOT to Do

- Do NOT call Medicare.gov directly from the browser — all calls must go through our API routes → Render proxy
- Do NOT create a separate comparison page/route — use a modal overlay (consistent with Life Insurance comparison)
- Do NOT hardcode benefit categories — parse them from the plan detail API response dynamically
- Do NOT fetch plan details on page load — only fetch when user clicks "Compare"
- Do NOT remove the existing inline comparison table — keep it as a quick-glance summary, and add the modal as a deeper "Full Comparison" option

---

## Summary of Deliverables

1. **`src/app/api/plan-detail/route.ts`** — New API route for plan detail
2. **`src/types/index.ts`** — New `MAPlanDetail` type (built from actual API response)
3. **`src/providers/quoteProvider.ts`** — New `fetchPlanDetail()` function
4. **`src/components/MACompareModal.tsx`** — New full comparison modal
5. **`src/components/MAResults.tsx`** — Modified to add "Full Comparison" button that opens the modal
