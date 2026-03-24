import {
  Quote,
  QuoteRequest,
  County,
  MedigapPolicy,
  MAPlan,
  PDPPlan,
  Drug,
  Pharmacy,
  Provider,
  LifeQuoteRequest,
  LifeComparisonResponse,
  LifeQuoteResult,
  LifeCompany,
  LifeIssueType,
} from "@/types";

/**
 * Quote Provider Layer
 *
 * This module calls our Next.js API routes, which proxy to Medicare.gov:
 *   - /api/counties          — resolves ZIP → state/FIPS
 *   - /api/medigap-policies  — Medigap carrier-level data
 *   - /api/plans-search      — Medicare Advantage & Part D plans
 *   - /api/drugs-autocomplete — Drug name search
 *   - /api/pharmacies        — Pharmacy lookup by ZIP
 */

/* ------------------------------------------------------------------ */
/*  Shared helpers                                                    */
/* ------------------------------------------------------------------ */

const RATE_TYPE_LABELS: Record<string, string> = {
  MEDIGAP_RATE_TYPE_ATTAINED_AGE: "Attained Age",
  MEDIGAP_RATE_TYPE_COMMUNITY_RATED: "Community Rated",
  MEDIGAP_RATE_TYPE_ISSUE_AGE: "Issue Age",
};

export async function lookupCounty(zip: string): Promise<County> {
  const res = await fetch(`/api/counties?zipcode=${encodeURIComponent(zip)}`);
  if (!res.ok) throw new Error("Failed to look up ZIP code");
  const data = await res.json();
  if (!data.counties || data.counties.length === 0) {
    throw new Error("No results found for that ZIP code");
  }
  return data.counties[0];
}

/* ------------------------------------------------------------------ */
/*  Medigap (existing)                                                */
/* ------------------------------------------------------------------ */

async function fetchPolicies(
  state: string,
  zip: string,
  plan: string
): Promise<MedigapPolicy[]> {
  const res = await fetch(
    `/api/medigap-policies?state=${encodeURIComponent(state)}&zipcode=${encodeURIComponent(zip)}&plan=${encodeURIComponent(plan)}`
  );
  if (!res.ok) throw new Error("Failed to fetch medigap policies");
  const data = await res.json();
  return data.policies ?? [];
}

export async function fetchQuotes(request: QuoteRequest): Promise<Quote[]> {
  const county = await lookupCounty(request.zip);
  const policies = await fetchPolicies(county.state, request.zip, request.plan);

  return policies.map((policy, i) => ({
    id: `quote-${i + 1}`,
    carrier: policy.company,
    plan: request.plan.toUpperCase(),
    premium: policy.monthly_rate_min,
    premiumMax: policy.monthly_rate_max,
    rateType: RATE_TYPE_LABELS[policy.rate_type] ?? policy.rate_type,
    phone: policy.phone_number,
    website: policy.website,
  }));
}

/* ------------------------------------------------------------------ */
/*  Medicare Advantage (MAPD)                                         */
/* ------------------------------------------------------------------ */

export async function fetchMAPlans(
  zip: string,
  fips: string,
  year: string = "2026",
  page: number = 0,
  npis: string[] = [],
  prescriptions: { rxcui: string; ndc?: string; quantity: number; frequency: string }[] = []
): Promise<MAPlan[]> {
  const qs = new URLSearchParams({
    plan_type: "PLAN_TYPE_MAPD",
    zip,
    fips,
    year,
    page: String(page),
  });

  // Build POST body — Medicare.gov uses protobuf field names:
  //   ndc (not rxcui), quantity, frequency — no is_insulin field
  const body: Record<string, unknown> = {};
  if (npis.length > 0) body.npis = npis;
  if (prescriptions.length > 0) {
    body.prescriptions = prescriptions.map((p) => ({
      ndc: p.ndc || p.rxcui, // use NDC if available, fall back to rxcui
      quantity: p.quantity,
      frequency: p.frequency,
    }));
  }

  const res = await fetch(`/api/plans-search?${qs.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const detail = errBody.detail || errBody.error || `Status ${res.status}`;
    throw new Error(`Failed to fetch MA plans: ${detail}`);
  }
  const data = await res.json();
  return data.plans ?? [];
}

/* ------------------------------------------------------------------ */
/*  Part D (PDP)                                                      */
/* ------------------------------------------------------------------ */

export async function fetchPDPPlans(
  zip: string,
  fips: string,
  year: string = "2026",
  page: number = 0,
  npis: string[] = [],
  prescriptions: { rxcui: string; ndc?: string; quantity: number; frequency: string }[] = []
): Promise<PDPPlan[]> {
  const qs = new URLSearchParams({
    plan_type: "PLAN_TYPE_PDP",
    zip,
    fips,
    year,
    page: String(page),
  });

  // Build POST body — same protobuf field names as MA
  const body: Record<string, unknown> = {};
  if (npis.length > 0) body.npis = npis;
  if (prescriptions.length > 0) {
    body.prescriptions = prescriptions.map((p) => ({
      ndc: p.ndc || p.rxcui,
      quantity: p.quantity,
      frequency: p.frequency,
    }));
  }

  const res = await fetch(`/api/plans-search?${qs.toString()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const detail = errBody.detail || errBody.error || `Status ${res.status}`;
    throw new Error(`Failed to fetch PDP plans: ${detail}`);
  }
  const data = await res.json();
  return data.plans ?? [];
}

/* ------------------------------------------------------------------ */
/*  Drug Search                                                       */
/* ------------------------------------------------------------------ */

export type DrugSearchResult = {
  drugs: Drug[];
  /** If set, results came from a brand-name fallback because the generic wasn't indexed */
  fallback_used?: string;
  /** The original query that triggered the fallback */
  original_query?: string;
};

export async function searchDrugs(
  name: string,
  year: string = "2026"
): Promise<DrugSearchResult> {
  if (name.length < 3) return { drugs: [] };
  const qs = new URLSearchParams({ name, year });
  const res = await fetch(`/api/drugs-autocomplete?${qs.toString()}`);
  if (!res.ok) throw new Error("Failed to search drugs");
  const data = await res.json();
  return {
    drugs: data.drugs ?? [],
    fallback_used: data.fallback_used,
    original_query: data.original_query,
  };
}

/* ------------------------------------------------------------------ */
/*  Pharmacy Search                                                   */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Provider / Physician Search (NPPES NPI Registry)                  */
/* ------------------------------------------------------------------ */

export async function searchProviders(
  name: string,
  state?: string,
  zip?: string
): Promise<Provider[]> {
  if (name.length < 2) return [];
  const qs = new URLSearchParams({ name, limit: "10" });
  if (state) qs.set("state", state);
  if (zip) qs.set("zip", zip);
  const res = await fetch(`/api/providers?${qs.toString()}`);
  if (!res.ok) throw new Error("Failed to search providers");
  const data = await res.json();
  return data.providers ?? [];
}

/* ------------------------------------------------------------------ */
/*  Pharmacy Search                                                   */
/* ------------------------------------------------------------------ */

export async function searchPharmacies(
  zip: string,
  address?: string
): Promise<Pharmacy[]> {
  let url = `/api/pharmacies?zipcode=${encodeURIComponent(zip)}`;
  if (address) {
    url += `&address=${encodeURIComponent(address)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to search pharmacies");
  const data = await res.json();

  // The API returns GeoJSON FeatureCollection
  const features = data.pharmacies?.features ?? [];
  return features.map(
    (f: { properties: Record<string, unknown> }) => f.properties as Pharmacy
  );
}

/* ------------------------------------------------------------------ */
/*  Life Insurance (Compulife API)                                     */
/* ------------------------------------------------------------------ */

/**
 * Detect whether a life insurance product is Guaranteed Issue, Simplified Issue,
 * or fully underwritten based on product name and category indicators.
 *
 * - GIWL / "Graded Benefit" products are always Guaranteed Issue
 * - Products with "Simplified" or "SI" in the name are Simplified Issue
 * - Products with "Final Expense" / "FE" in the name without "Graded" are SI
 * - Everything else is assumed to be underwritten (paramed)
 */
function detectIssueType(r: Record<string, string>): LifeIssueType {
  const product = (r.Compulife_product || "").toLowerCase();
  const company = (r.Compulife_company || "").toLowerCase();
  const code = (r.Compulife_compprodcode || "").toUpperCase();

  // Guaranteed Issue indicators
  const giPatterns = [
    "graded", "guaranteed issue", "guaranteed acceptance",
    "gi ", "giwl", "g.i.", "guaranteed-issue",
  ];
  if (giPatterns.some((p) => product.includes(p))) return "gi";
  // GIWL category code starts with Y in Compulife
  if (code.startsWith("Y")) return "gi";

  // Simplified Issue indicators
  const siPatterns = [
    "simplified", "simplified issue", "si ", " si",
    "final expense", "final exp", " fe ", "burial",
    "no exam", "no-exam", "express issue", "easy issue",
    "quick issue", "select-a-term",
  ];
  if (siPatterns.some((p) => product.includes(p))) return "si";

  return "unknown";
}

/**
 * Single API call to fetch quotes for one category.
 */
async function fetchLifeQuotesRaw(
  request: LifeQuoteRequest,
  categoryOverride?: string
): Promise<LifeComparisonResponse[]> {
  const res = await fetch("/api/life-quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      state: request.state,
      zipCode: request.zipCode,
      birthMonth: request.birthMonth,
      birthDay: request.birthDay,
      birthYear: request.birthYear,
      gender: request.gender,
      smoker: request.smoker,
      health: request.health,
      category: categoryOverride || request.category,
      faceAmount: request.faceAmount,
      mode: request.mode,
      requestType: "request",
      compInc: request.compInc || undefined,
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Failed to fetch life quotes: ${res.status}`);
  }

  const data = await res.json();

  // Parse Compulife response format
  const comparisons = data.Compulife_ComparisonResults;
  if (!comparisons) {
    throw new Error(data.message || "No results returned from Compulife");
  }

  // Normalize to array
  const items = Array.isArray(comparisons) ? comparisons : [comparisons];

  return items.map(
    (item: {
      Compulife_title?: string;
      Compulife_Results?: Array<Record<string, string>>;
    }) => {
      const title = item.Compulife_title || "";
      return {
        title,
        results: (item.Compulife_Results || []).map(
          (r: Record<string, string>): LifeQuoteResult => ({
            company: r.Compulife_company || "",
            product: r.Compulife_product || "",
            compProdCode: r.Compulife_compprodcode || "",
            amBest: r.Compulife_ambest || "",
            amBestId: r.Compulife_amb || "",
            premiumAnnual: r.Compulife_premiumAnnual || "",
            premiumMonthly: r.Compulife_premiumM || null,
            premiumQuarterly: r.Compulife_premiumQ || null,
            premiumSemiAnnual: r.Compulife_premiumH || null,
            healthClass: r.Compulife_rgpfpp || "",
            issueType: detectIssueType(r),
            categoryTitle: title,
          })
        ),
      };
    }
  );
}

/**
 * Fetch life quotes.
 * - For "All Final Expense" (Z:8PQRSOY): two parallel API calls
 *   because Compulife doesn't allow mixing GIWL (Y) with UL categories
 *   in a single Z: code. We merge SI + GI results.
 * - For "GI Only" (Y): single call with health forced to "R",
 *   all results tagged as GI.
 */
export async function fetchLifeQuotes(
  request: LifeQuoteRequest
): Promise<LifeComparisonResponse[]> {
  // Special handling: "All Final Expense" needs two calls because
  // Compulife doesn't allow mixing GIWL (Y) with UL categories in Z: codes
  if (request.category === "Z:8PQRSOY") {
    // GIWL products are guaranteed issue — no health underwriting.
    // The API requires "R" (Regular) health for GIWL; other classes fail.
    const giwlRequest = { ...request, health: "R" };
    const [ulResults, giwlResults] = await Promise.all([
      fetchLifeQuotesRaw(request, "Z:8PQRSO"),
      fetchLifeQuotesRaw(giwlRequest, "Y").catch(() => [] as LifeComparisonResponse[]),
    ]);

    // UL products at final expense face amounts are effectively simplified issue
    // unless the name detection already flagged them otherwise
    for (const comp of ulResults) {
      for (const r of comp.results) {
        if (r.issueType === "unknown") r.issueType = "si";
      }
    }

    // GIWL results are always guaranteed issue
    for (const comp of giwlResults) {
      for (const r of comp.results) {
        r.issueType = "gi";
      }
    }

    // Merge: combine all results into a single comparison response
    const allResults = [
      ...ulResults.flatMap((c) => c.results),
      ...giwlResults.flatMap((c) => c.results),
    ];

    return [{
      title: "All Final Expense Products (Simplified Issue + Guaranteed Issue)",
      results: allResults,
    }];
  }

  // When querying SI-only (Z:8PQRSO) directly, tag all results as SI
  if (request.category === "Z:8PQRSO") {
    const results = await fetchLifeQuotesRaw(request);
    for (const comp of results) {
      for (const r of comp.results) {
        r.issueType = "si";
      }
    }
    return results;
  }

  // When querying GIWL (Y) directly, ALL results are guaranteed issue
  // by definition — don't rely on name-based detection alone
  if (request.category === "Y") {
    const giwlRequest = { ...request, health: "R" };
    const results = await fetchLifeQuotesRaw(giwlRequest);
    for (const comp of results) {
      for (const r of comp.results) {
        r.issueType = "gi";
      }
    }
    return results;
  }

  return fetchLifeQuotesRaw(request);
}

export async function fetchLifeCompanies(): Promise<LifeCompany[]> {
  const res = await fetch("/api/life-companies");
  if (!res.ok) throw new Error("Failed to fetch life insurance companies");
  const data = await res.json();
  return (data || []).map(
    (c: { CompCode: string; Name: string }) => ({
      compCode: c.CompCode,
      name: c.Name,
    })
  );
}
