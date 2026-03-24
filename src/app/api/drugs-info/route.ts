import { NextRequest, NextResponse } from "next/server";

const MEDICARE_API_BASE = "https://www.medicare.gov/api/v1/data/plan-compare";
const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  Accept: "*/*",
  "Content-Type": "application/json",
  "Fe-Ver": "2.64.0",
  Referer: "https://www.medicare.gov/plan-compare/",
  Origin: "https://www.medicare.gov",
};

/**
 * POST /api/drugs-info?rxcui=235743
 *
 * Proxies to Medicare.gov drugs/info/{rxcui} endpoint.
 * Returns dosage/NDC info for a drug.
 * Body: { ndcs: [] }
 */
export async function POST(request: NextRequest) {
  const rxcui = request.nextUrl.searchParams.get("rxcui");
  const year = request.nextUrl.searchParams.get("year") ?? "2026";

  if (!rxcui) {
    return NextResponse.json(
      { error: "rxcui query parameter is required" },
      { status: 400 }
    );
  }

  try {
    let body = "{}";
    try {
      const incoming = await request.json();
      body = JSON.stringify(incoming);
    } catch {
      body = JSON.stringify({ ndcs: [] });
    }

    const upstream = await fetch(
      `${MEDICARE_API_BASE}/drugs/info/${encodeURIComponent(rxcui)}?year=${year}`,
      {
        method: "POST",
        headers: HEADERS,
        body,
      }
    );

    if (!upstream.ok) {
      const errText = await upstream.text();
      return NextResponse.json(
        { error: `Medicare.gov returned ${upstream.status}: ${errText}` },
        { status: 502 }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch drug info" },
      { status: 502 }
    );
  }
}
