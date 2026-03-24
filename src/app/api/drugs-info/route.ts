import { NextRequest, NextResponse } from "next/server";
import { medicarePost } from "@/lib/medicare-proxy";

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

    const res = await medicarePost(
      `/drugs/info/${encodeURIComponent(rxcui)}?year=${year}`,
      body
    );

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Medicare.gov returned ${res.status}: ${errText}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch drug info" },
      { status: 502 }
    );
  }
}
