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
      console.error("[counties] Upstream error:", res.status, text.substring(0, 500));
      return NextResponse.json(
        { error: `County lookup returned an error (${res.status})` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("[counties] Exception:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Failed to fetch county data" },
      { status: 502 }
    );
  }
}
