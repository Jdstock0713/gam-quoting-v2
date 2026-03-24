import { NextRequest, NextResponse } from "next/server";

const MEDICARE_API_BASE = "https://www.medicare.gov/api/v1/data/plan-compare";
const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  Accept: "*/*",
  "Fe-Ver": "2.64.0",
  Referer: "https://www.medicare.gov/plan-compare/",
  Origin: "https://www.medicare.gov",
};

/**
 * GET /api/pharmacies?zipcode=48383[&address=123+Main+St]
 *
 * Proxies to Medicare.gov geography/pharmacies/address endpoint.
 * If an address is provided, appends it for proximity-based results.
 */
export async function GET(request: NextRequest) {
  const zipcode = request.nextUrl.searchParams.get("zipcode");
  const address = request.nextUrl.searchParams.get("address");

  if (!zipcode) {
    return NextResponse.json(
      { error: "zipcode query parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Build the upstream URL — Medicare.gov accepts an address param
    // for more precise geolocation
    let url = `${MEDICARE_API_BASE}/geography/pharmacies/address?zipcode=${encodeURIComponent(zipcode)}`;
    if (address) {
      url += `&address=${encodeURIComponent(address)}`;
    }

    const upstream = await fetch(url, { headers: HEADERS });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Medicare.gov returned ${upstream.status}` },
        { status: 502 }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch pharmacies" },
      { status: 502 }
    );
  }
}
