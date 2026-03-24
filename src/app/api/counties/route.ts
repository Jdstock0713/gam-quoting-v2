import { NextRequest, NextResponse } from "next/server";
import { medicareGet } from "@/lib/medicare-proxy";

export async function GET(request: NextRequest) {
  const zipcode = request.nextUrl.searchParams.get("zipcode");
  if (!zipcode) {
    return NextResponse.json({ error: "zipcode is required" }, { status: 400 });
  }

  try {
    const res = await medicareGet(
      `/geography/counties?zipcode=${encodeURIComponent(zipcode)}`
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Medicare.gov returned ${res.status}`, details: text },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch county data", details: msg },
      { status: 502 }
    );
  }
}
