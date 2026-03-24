# Medicare Quoting Tool — Full Technical Specification

> **IMPORTANT:** This is the authoritative specification for the Medicare Quoting Tool.
> Before implementing ANY changes to this codebase, read this document in full.
> All new features, bug fixes, and refactors must be consistent with the architecture,
> conventions, and data-handling rules described here.

---

## Overview

The Medicare Quoting Tool is a Next.js web application for insurance brokers that pulls live data directly from Medicare.gov's Plan Compare API and the NPPES NPI Registry. It supports three plan types: Medigap (Medicare Supplement), Medicare Advantage (Part C/MAPD), and Part D (Prescription Drug Plans). It also provides drug search, pharmacy lookup, and physician/provider search.

---

## Architecture

### User Flow

```
ZIP Code Entry → County Resolution → Plan Type Selection → Results View
                                         ├── Medigap → carrier policies
                                         ├── Medicare Advantage → MAPD plan search
                                         └── Part D → PDP plan search

Drug Search ──→ Autocomplete ──→ Select drug + dosage/frequency ──→ Attached to plan search
Provider Search ──→ NPPES lookup ──→ Select provider ──→ NPI attached to plan search
Pharmacy Search ──→ ZIP-based ──→ Select pharmacy ──→ NPI attached to drug cost lookup
```

### API Proxy Pattern

All external API calls are proxied through our Next.js API routes to avoid CORS issues and control headers:

```
Browser → /api/* (Next.js routes) → Medicare.gov /api/v1/data/plan-compare/*
Browser → /api/providers          → NPPES NPI Registry (npiregistry.cms.hhs.gov)
```

### Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Data:** All live from Medicare.gov and NPPES — no mock data, no local database
- **State:** Client-side React state (no external state management)

---

## External APIs

### 1. Medicare.gov Plan Compare API

**Base URL:** `https://www.medicare.gov/api/v1/data/plan-compare`

#### Required Headers

| Header | Value |
|--------|-------|
| User-Agent | `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36` |
| Accept | `*/*` (GET) or `application/json` (POST) |
| Fe-Ver | `2.64.0` |
| Referer | `https://www.medicare.gov/plan-compare/` |
| Origin | `https://www.medicare.gov` |
| Content-Type | `application/json` (POST only) |

#### Geography Endpoints

| Endpoint | Method | Params | Returns |
|----------|--------|--------|---------|
| `/geography/counties` | GET | `zipcode` | `{ counties: [{ name, fips, state }] }` |
| `/geography/pharmacies/address` | GET | `zipcode`, `address` (optional) | GeoJSON FeatureCollection of pharmacies |

#### Medigap Endpoints

| Endpoint | Method | Params | Returns |
|----------|--------|--------|---------|
| `/medigap/plans` | GET | `state`, `zipcode` | Array of plan types with premium ranges |
| `/medigap/policies` | GET | `state`, `zipcode`, `medigap_plan_type` | Array of carrier policies |

**Plan Type Enum Values:** `MEDIGAP_PLAN_TYPE_A` through `MEDIGAP_PLAN_TYPE_N` (including `HIGH_F` and `HIGH_G`)

#### Plan Search Endpoint (MA + Part D)

| Endpoint | Method | Query Params | Body | Returns |
|----------|--------|-------------|------|---------|
| `/plans/search` | POST | `plan_type`, `year`, `zip`, `fips`, `page` | `{}` or `{ npis, prescriptions }` | `{ plans: [...] }` |

**Plan Type Values:**
- `PLAN_TYPE_MAPD` — Medicare Advantage with drug coverage
- `PLAN_TYPE_MA` — Medicare Advantage without drug coverage
- `PLAN_TYPE_PDP` — Part D Prescription Drug Plans

#### Drug Endpoints

| Endpoint | Method | Params | Returns |
|----------|--------|--------|---------|
| `/drugs/autocomplete` | GET | `name`, `year` | `{ drugs: [{ rxcui, name, is_generic, insulin, generic, generics }] }` |
| `/drugs/list/{letter}` | GET | `year` | Array of drugs starting with letter |
| `/drugs/cost` | POST | body: `{ npis, prescriptions, lis, plans, full_year, retailOnly }` | Drug cost breakdown per plan |
| `/drugs/info/{rxcui}` | POST | body: `{ ndcs }` | Drug info list with dosages |

#### Plan Details

| Endpoint | Method | Params | Returns |
|----------|--------|--------|---------|
| `/plan/{year}/{contract_id}/{plan_id}/{segment_id}` | GET | (path) | Full plan card with benefits, star ratings, supplemental benefits |

### 2. NPPES NPI Registry API

**Base URL:** `https://npiregistry.cms.hhs.gov/api/`

**Documentation:** https://npiregistry.cms.hhs.gov/api-page

Used for physician/provider search. Public, no authentication required.

| Param | Value |
|-------|-------|
| `version` | `2.1` |
| `enumeration_type` | `NPI-1` (individuals only) |
| `first_name` | With wildcard suffix `*` |
| `last_name` | With wildcard suffix `*` |
| `state` | Optional 2-letter state code |
| `postal_code` | Optional ZIP code |
| `limit` | Max results (default 10) |

### 3. openFDA API (QA Monitoring Only)

**Base URL:** `https://api.fda.gov`

Used by the automated QA auditor (not the production tool) to cross-reference drug availability and detect data freshness gaps.

| Endpoint | Purpose |
|----------|---------|
| `/drug/drugsfda.json` | Track new FDA drug approvals and approval dates |
| `/drug/ndc.json` | Look up NDC codes to confirm drugs are marketed |
| `/drug/label.json` | Monitor labeling changes |
| `/drug/enforcement.json` | Track recalls and enforcement actions |

**Key QA use case:** If a drug has an NDC in openFDA but is NOT in Medicare.gov's autocomplete, that's a data freshness gap. If a drug has FDA approval but NO NDC, it hasn't reached market yet.

---

## Our API Routes

| Route | Method | Proxies To | Notes |
|-------|--------|-----------|-------|
| `/api/counties?zipcode=...` | GET | `/geography/counties` | Uses Node.js `https` module |
| `/api/medigap-policies?state=...&zipcode=...&plan=...` | GET | `/medigap/policies` | Plan letter mapped to enum |
| `/api/plans-search?plan_type=...&zip=...&fips=...&year=...&page=...` | POST | `/plans/search` | Body forwarded for drugs/NPIs |
| `/api/drugs-autocomplete?name=...&year=...` | GET | `/drugs/autocomplete` | **Has generic-to-brand fallback** |
| `/api/drugs-info?rxcui=...&year=...` | POST | `/drugs/info/{rxcui}` | Body: `{ ndcs }` |
| `/api/pharmacies?zipcode=...[&address=...]` | GET | `/geography/pharmacies/address` | Optional address param |
| `/api/providers?name=...&state=...&zip=...&limit=...` | GET | NPPES NPI Registry | **Has surname prefix stripping** |

---

## Smart Fallback Behaviors

### Drug Search: Generic-to-Brand Fallback

**Problem:** Medicare.gov's autocomplete uses fuzzy matching and does not always resolve generic (INN) names. For example, searching "empagliflozin" returns "dapagliflozin" (a different drug), and "apixaban" returns "rivaroxaban."

**Solution:** The `/api/drugs-autocomplete` route maintains a `GENERIC_TO_BRAND_FALLBACK` mapping. When the upstream autocomplete returns no exact match for the user's query and the query matches a known generic name, the route automatically retries with the brand name.

**Response format with fallback:**
```json
{
  "drugs": [...],
  "fallback_used": "Jardiance",
  "original_query": "empagliflozin"
}
```

**Frontend behavior:** When `fallback_used` is present, the DrugSearch component displays an amber banner: *"Showing results for brand name Jardiance (generic name not directly indexed)"*

**Maintenance:** The `GENERIC_TO_BRAND_FALLBACK` map is located in `src/app/api/drugs-autocomplete/route.ts`. It should be updated when:
- A new generic is found missing from Medicare.gov's autocomplete (add entry)
- A previously failing generic starts working (remove entry)
- The automated QA auditor flags new gaps

**Current entries:**
| Generic | Brand Fallback |
|---------|---------------|
| apixaban | Eliquis |
| empagliflozin | Jardiance |
| canagliflozin | Invokana |
| semaglutide | Ozempic |
| tirzepatide | Mounjaro |
| liraglutide | Victoza |
| dulaglutide | Trulicity |
| sacubitril | Entresto |
| fluticasone/umeclidinium/vilanterol | Trelegy Ellipta |
| fluticasone/vilanterol | Breo Ellipta |
| suzetrigine | Journavx |
| gepotidacin | Blujepa |

### Provider Search: Surname Prefix Stripping

**Problem:** Cultural naming conventions include prefixes like Al-, El-, De-, Van-, etc. NPPES often stores only the root surname (e.g., "RASHID" not "AL-RASHID"). Searching "Mohammed Al-Rashid" returns zero results.

**Solution:** The `/api/providers` route detects when a search returns zero results and the last name contains a recognized cultural prefix. It automatically retries with the prefix stripped.

**Recognized prefixes:** `al, el, de, del, di, la, le, van, von, bin, ibn, abu, mac, mc, o', st, san, das, dos, ben` (with or without hyphen/space separator)

**Behavior:**
1. Primary search with full name as entered
2. If zero results AND last name matches a known prefix pattern → retry with prefix removed
3. Results are deduplicated by NPI
4. No extra latency when primary search succeeds (retry is conditional)

**Code location:** `src/app/api/providers/route.ts`

---

## Components

| Component | File | Purpose |
|-----------|------|---------|
| `ZipEntry` | `src/components/ZipEntry.tsx` | ZIP code input, county resolution, plan type selection |
| `MedigapResults` | `src/components/MedigapResults.tsx` | Full Medigap quoting flow |
| `MAResults` | `src/components/MAResults.tsx` | Medicare Advantage plan listing, sort, compare |
| `PDPResults` | `src/components/PDPResults.tsx` | Part D plan listing, sort, compare |
| `DrugSearch` | `src/components/DrugSearch.tsx` | Drug autocomplete with brand fallback hint |
| `ProviderSearch` | `src/components/ProviderSearch.tsx` | Physician search via NPPES |
| `PharmacyPicker` | `src/components/PharmacyPicker.tsx` | Pharmacy selection by ZIP |
| `QuoteForm` | `src/components/QuoteForm.tsx` | Medigap-specific form (age, gender, tobacco, plan letter) |
| `QuoteList` | `src/components/QuoteList.tsx` | Medigap quote cards grid |
| `QuoteCard` | `src/components/QuoteCard.tsx` | Individual Medigap quote with carrier info |
| `ComparisonView` | `src/components/ComparisonView.tsx` | Medigap side-by-side comparison |
| `CarrierSettings` | `src/components/CarrierSettings.tsx` | Medigap carrier filter checkboxes |
| `CarrierDetail` | `src/components/CarrierDetail.tsx` | Carrier detail view |
| `QuoteDetails` | `src/components/QuoteDetails.tsx` | Medigap quote detail modal |
| `StepTracker` | `src/components/StepTracker.tsx` | Multi-step progress indicator |

---

## Provider Layer

All API calls from components go through `src/providers/quoteProvider.ts`, which is the single data-access layer. Components never call `fetch()` directly.

### Exported Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `lookupCounty(zip)` | `County` | Resolves ZIP to county/state/FIPS |
| `fetchQuotes(request)` | `Quote[]` | Medigap quotes (policies mapped to our Quote type) |
| `fetchMAPlans(zip, fips, year, page, npis, prescriptions)` | `MAPlan[]` | Medicare Advantage plans |
| `fetchPDPPlans(zip, fips, year, page, npis, prescriptions)` | `PDPPlan[]` | Part D plans |
| `searchDrugs(name, year)` | `DrugSearchResult` | Drug autocomplete (includes fallback info) |
| `searchProviders(name, state, zip)` | `Provider[]` | NPPES provider search |
| `searchPharmacies(zip, address)` | `Pharmacy[]` | Pharmacy lookup |

### DrugSearchResult Type

```typescript
type DrugSearchResult = {
  drugs: Drug[];
  fallback_used?: string;     // Brand name used as fallback
  original_query?: string;    // Original generic query
};
```

---

## TypeScript Types

All types are defined in `src/types/index.ts`.

### Shared
- `PlanType` = `"medigap" | "ma" | "pdp"`
- `County` = `{ name, fips, state }`

### Medigap
- `QuoteRequest` = `{ zip, age, gender, tobacco, plan }`
- `Quote` = `{ id, carrier, plan, premium, premiumMax, rateType, phone, website }`
- `MedigapPolicy` — raw policy from Medicare.gov with rate variants

### Medicare Advantage
- `MASearchRequest` = `{ zip, fips, year?, page? }`
- `MAPlan` — full plan object with premiums, deductibles, star ratings, benefits, cost sharing

### Part D
- `PDPSearchRequest` = `{ zip, fips, year?, page? }`
- `PDPPlan` — plan object with drug-specific fields

### Drug / Pharmacy / Provider
- `Drug` = `{ rxcui, name, is_generic, insulin, generic, generics }`
- `Pharmacy` = `{ name, street, city, state, zipcode, npi, phone, distance_miles }`
- `Provider` = `{ npi, first_name, last_name, credential, specialty, city, state, zip, phone }`

---

## Data Source & Freshness

All data is sourced live from **Medicare.gov** and **NPPES**. No mock data is used.

### Important data freshness notes:
- The Medicare.gov API serves the **current plan year** (currently 2026). The `year` parameter defaults to `2026`.
- Drug formulary data lags FDA approvals by **weeks to months**. A drug can be FDA-approved but not yet on any Part D formulary.
- The openFDA NDC endpoint can confirm whether a drug is being marketed (has an NDC code) even before it appears in Medicare.gov.
- NPPES data updates weekly. New providers may take 1-2 weeks to appear.
- Part B drugs (IV-administered, e.g., Keytruda/pembrolizumab) do NOT appear in the Part D drug autocomplete. This is expected behavior, not a bug.

---

## Known Limitations & Edge Cases

### Drug Search
1. **Fuzzy matching:** Medicare.gov's autocomplete uses fuzzy/phonetic matching, not exact. Searching a generic name may return a different drug with a similar-sounding name. The generic-to-brand fallback mitigates this for known cases.
2. **Multi-word brands:** Drugs like "Trelegy Ellipta" and "Breo Ellipta" are indexed as "Trelegy" and "Breo" only. The " Ellipta" suffix is not part of the match. This is cosmetic and functional.
3. **Part B vs Part D:** IV-administered drugs (cancer immunotherapies, infusions) are covered under Part B and will NOT appear in drug search results. This is correct behavior.
4. **New drug lag:** Newly FDA-approved drugs may take 3-12 months to appear in Medicare formularies.

### ZIP Codes
1. **PO Box ZIPs:** Some ZIP codes (e.g., 02101 Boston) are PO Box-only and have no county mapping in Medicare.gov. The API returns 404 for these. Nearby residential ZIPs work fine.
2. **Multi-county ZIPs:** Some ZIPs span multiple counties. The API returns all matching counties; we use the first one by default.

### Provider Search
1. **Wildcard matching:** NPPES uses prefix wildcard matching (`Smith*`), which can return unexpected partial matches.
2. **Surname prefixes:** Cultural prefixes (Al-, El-, De-, Van-, etc.) are automatically stripped on retry if zero results. See "Surname Prefix Stripping" above.
3. **Name splitting:** Names with 2+ words are split into first_name + last_name. Single-word queries search by last_name only.

---

## Automated QA Monitoring

A recurring automated QA audit runs on a schedule to monitor data quality. It tests:

1. **Drug search validation** — 12 generic names, 12 brand names per cycle
2. **New-to-market drug monitoring** — Cross-references openFDA (NDC + Drugs@FDA) with Medicare.gov to detect data freshness gaps
3. **Physician search validation** — Diverse names including edge cases (hyphenated, prefixed, etc.)
4. **ZIP code consistency** — Same searches across multiple ZIPs to confirm expected behavior
5. **Regression retesting** — Previously failed items are retested until resolved

### openFDA Cross-Reference Logic

For new drugs, the QA auditor checks:

| openFDA NDC | Medicare.gov | Interpretation |
|------------|-------------|----------------|
| Has NDC | Found | Drug is marketed and in formulary — all good |
| Has NDC | NOT found | **Data freshness gap** — drug is on the market but not yet in Medicare formularies |
| No NDC | NOT found | Drug is FDA-approved but not yet marketed — expected |
| No NDC | Found | Unusual — investigate |

### QA Report Output

Each cycle produces an Excel report with tabs:
1. QA Results Table
2. Failure Log
3. Executive Summary
4. Priority Fixes
5. Data Freshness Risks
6. Rolling Test History
7. Regression Retest Queue

---

## Future Enhancements

1. **Drug Cost Integration** — Use `/drugs/cost` POST endpoint to show estimated annual drug costs per plan when user adds their prescriptions
2. **Pharmacy Network Check** — Use `/geography/plan/{id}/pharmacies` to show in-network pharmacies per plan
3. **In-Network Provider Check** — Use `/beneinfo/providers` to verify if a doctor is in a specific plan's network
4. **Plan Detail Cards** — Use `/plan/{year}/{contract}/{plan}/{segment}` for comprehensive benefit breakdowns
5. **Pagination** — MA and PDP search supports `page` param for loading more results
6. **MA-only Plans** — Add `PLAN_TYPE_MA` (no drug coverage) as a separate option
7. **PO Box ZIP Fallback** — When a ZIP returns 404, suggest nearby residential ZIPs
8. **Drug Cost Comparison** — Side-by-side drug cost comparison across plans
