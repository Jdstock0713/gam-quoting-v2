import { NextRequest, NextResponse } from "next/server";
import { medicareGet } from "@/lib/medicare-proxy";

/**
 * Generic-to-brand fallback mapping.
 *
 * Medicare.gov's autocomplete uses fuzzy matching and does not always resolve
 * generic (INN) names to the correct drug — especially for newer or less common
 * generics. This map lets us retry with the brand name when the generic search
 * returns zero exact matches.
 *
 * The key is the lowercase generic name; the value is the brand name to retry.
 * This list should be kept up-to-date as new drugs enter the market. Entries
 * can be removed once Medicare.gov's autocomplete correctly indexes the generic.
 *
 * ## Maintenance
 * - The scheduled QA auditor tests these generics each cycle.
 * - If a previously failing generic starts returning correct results, remove it.
 * - When a new generic is found missing, add it here with its brand name.
 */
const GENERIC_TO_BRAND_FALLBACK: Record<string, string> = {
  // Anticoagulants
  apixaban: "Eliquis",
  // SGLT2 inhibitors
  empagliflozin: "Jardiance",
  canagliflozin: "Invokana",
  // GLP-1 receptor agonists
  semaglutide: "Ozempic",
  tirzepatide: "Mounjaro",
  liraglutide: "Victoza",
  dulaglutide: "Trulicity",
  // Cardiovascular
  sacubitril: "Entresto",
  // Respiratory (combination inhalers)
  "fluticasone/umeclidinium/vilanterol": "Trelegy Ellipta",
  "fluticasone/vilanterol": "Breo Ellipta",
  // Newer approvals (2025+)
  suzetrigine: "Journavx",
  gepotidacin: "Blujepa",
};

type DrugResult = {
  rxcui: string;
  name: string;
  is_generic: boolean;
  insulin: boolean;
  generic: { rxcui: string; name: string; branded_generic: boolean } | null;
  generics: { rxcui: string; name: string; branded_generic: boolean }[];
};

/** Check if any result contains the search term as a substring (case-insensitive). */
function hasExactMatch(drugs: DrugResult[], searchTerm: string): boolean {
  const lower = searchTerm.toLowerCase();
  return drugs.some((d) => d.name.toLowerCase().includes(lower));
}

async function fetchAutocomplete(
  name: string,
  year: string
): Promise<{ drugs: DrugResult[] }> {
  const qs = new URLSearchParams({ name, year });
  const res = await medicareGet(`/drugs/autocomplete?${qs.toString()}`);
  if (!res.ok) {
    throw new Error(`Medicare.gov returned ${res.status}`);
  }
  return res.json();
}

/**
 * GET /api/drugs-autocomplete?name=metformin&year=2026
 *
 * Proxies to Medicare.gov drugs/autocomplete endpoint.
 *
 * ## Generic-to-brand fallback
 *
 * If the search term matches a known generic name in GENERIC_TO_BRAND_FALLBACK
 * and the upstream autocomplete returns no exact match, we automatically retry
 * with the brand name. The response includes a `fallback_used` field set to the
 * brand name when this happens, so the frontend can display a helpful hint.
 */
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  const year = request.nextUrl.searchParams.get("year") ?? "2026";

  if (!name) {
    return NextResponse.json(
      { error: "name query parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Primary search with the user's input
    const data = await fetchAutocomplete(name, year);
    const drugs = data.drugs ?? [];

    // Check whether we got an exact match
    if (hasExactMatch(drugs, name)) {
      return NextResponse.json(data);
    }

    // Attempt generic-to-brand fallback
    const brandFallback = GENERIC_TO_BRAND_FALLBACK[name.toLowerCase()];
    if (brandFallback) {
      const fallbackData = await fetchAutocomplete(brandFallback, year);
      const fallbackDrugs = fallbackData.drugs ?? [];

      if (fallbackDrugs.length > 0) {
        return NextResponse.json({
          drugs: fallbackDrugs,
          fallback_used: brandFallback,
          original_query: name,
        });
      }
    }

    // No fallback available or fallback also returned nothing — return original
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to search drugs" },
      { status: 502 }
    );
  }
}
