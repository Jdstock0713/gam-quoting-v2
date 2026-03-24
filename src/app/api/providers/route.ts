import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/providers?name=smith&state=MI&zip=48383&limit=10
 *
 * Proxies to the NPPES NPI Registry API (public, no auth required).
 * Returns individual providers (NPI-1 = people, not organizations).
 *
 * https://npiregistry.cms.hhs.gov/api-page
 *
 * ## Surname prefix handling
 *
 * Many cultural naming conventions include prefixes like Al-, El-, De-, Van-,
 * Del-, La-, etc. NPPES often stores only the root surname (e.g. "RASHID"
 * instead of "AL-RASHID"). When the initial search returns zero results and
 * the last name contains a recognized prefix, we automatically retry with the
 * prefix stripped. Both result sets are merged and deduplicated by NPI.
 */

/** Common surname prefixes (case-insensitive) that NPPES may omit */
const SURNAME_PREFIXES = /^(al|el|de|del|di|la|le|van|von|bin|ibn|abu|mac|mc|o'|st\.?|san|das|dos|ben)-?\s*/i;

type NppesResult = {
  number: string;
  basic?: Record<string, string>;
  taxonomies?: { desc?: string; primary?: boolean }[];
  addresses?: Record<string, string>[];
};

type MappedProvider = {
  npi: string;
  first_name: string;
  last_name: string;
  credential: string;
  specialty: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
};

function mapProvider(r: NppesResult): MappedProvider {
  const basic = r.basic ?? {};
  const taxonomy = r.taxonomies?.find((t) => t.primary) ?? r.taxonomies?.[0];
  const addr =
    r.addresses?.find(
      (a: Record<string, string>) => a.address_purpose === "LOCATION"
    ) ?? r.addresses?.[0];

  return {
    npi: r.number,
    first_name: basic.first_name ?? "",
    last_name: basic.last_name ?? "",
    credential: basic.credential ?? "",
    specialty: taxonomy?.desc ?? "",
    city: addr?.city ?? "",
    state: addr?.state ?? "",
    zip: (addr?.postal_code ?? "").slice(0, 5),
    phone: addr?.telephone_number ?? "",
  };
}

/** Build the first/last name query params from a full name string */
function buildNameParams(fullName: string): { first_name?: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return {
      first_name: parts[0] + "*",
      last_name: parts.slice(1).join(" ") + "*",
    };
  }
  return { last_name: fullName + "*" };
}

/** Strip a recognized cultural prefix from a last name. Returns null if no prefix found. */
function stripSurnamePrefix(lastName: string): string | null {
  const match = lastName.match(SURNAME_PREFIXES);
  if (!match) return null;
  const stripped = lastName.slice(match[0].length).trim();
  return stripped.length >= 2 ? stripped : null;
}

async function queryNppes(
  params: URLSearchParams,
  signal: AbortSignal
): Promise<{ results: NppesResult[]; count: number }> {
  const upstream = await fetch(
    `https://npiregistry.cms.hhs.gov/api/?${params.toString()}`,
    { signal }
  );
  if (!upstream.ok) throw new Error(`NPPES returned ${upstream.status}`);
  const data = await upstream.json();
  return { results: data.results ?? [], count: data.result_count ?? 0 };
}

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  const state = request.nextUrl.searchParams.get("state");
  const zip = request.nextUrl.searchParams.get("zip");
  const limit = request.nextUrl.searchParams.get("limit") ?? "10";

  if (!name || name.length < 2) {
    return NextResponse.json(
      { error: "name must be at least 2 characters" },
      { status: 400 }
    );
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    // --- Primary search ---
    const baseParams = new URLSearchParams({
      version: "2.1",
      enumeration_type: "NPI-1",
      limit,
    });

    const nameFields = buildNameParams(name);
    if (nameFields.first_name) baseParams.set("first_name", nameFields.first_name);
    baseParams.set("last_name", nameFields.last_name);
    if (state) baseParams.set("state", state);
    if (zip) baseParams.set("postal_code", zip);

    const primary = await queryNppes(baseParams, controller.signal);
    let allResults = primary.results;
    let totalCount = primary.count;

    // --- Prefix-stripped retry if primary returned 0 results ---
    if (primary.count === 0) {
      const parts = name.trim().split(/\s+/);
      const rawLastName = parts.length >= 2 ? parts.slice(1).join(" ") : name;
      const strippedLast = stripSurnamePrefix(rawLastName);

      if (strippedLast) {
        const retryParams = new URLSearchParams({
          version: "2.1",
          enumeration_type: "NPI-1",
          limit,
        });

        if (parts.length >= 2) {
          retryParams.set("first_name", parts[0] + "*");
        }
        retryParams.set("last_name", strippedLast + "*");
        if (state) retryParams.set("state", state);
        if (zip) retryParams.set("postal_code", zip);

        const retry = await queryNppes(retryParams, controller.signal);
        allResults = retry.results;
        totalCount = retry.count;
      }
    }

    clearTimeout(timeout);

    // Deduplicate by NPI (relevant when merging primary + retry)
    const seen = new Set<string>();
    const providers: MappedProvider[] = [];
    for (const r of allResults) {
      if (!seen.has(r.number)) {
        seen.add(r.number);
        providers.push(mapProvider(r));
      }
    }

    return NextResponse.json({ providers, total: totalCount });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json(
      { error: `Failed to search providers: ${msg}` },
      { status: 502 }
    );
  }
}
