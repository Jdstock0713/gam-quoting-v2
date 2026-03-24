import { NextRequest, NextResponse } from "next/server";
import { medicareGet } from "@/lib/medicare-proxy";

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
    let path = `/geography/pharmacies/address?zipcode=${encodeURIComponent(zipcode)}`;
    if (address) {
      path += `&address=${encodeURIComponent(address)}`;
    }

    const res = await medicareGet(path);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Medicare.gov returned ${res.status}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch pharmacies" },
      { status: 502 }
    );
  }
}
