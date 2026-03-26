import { NextRequest, NextResponse } from "next/server";
import { medicarePost } from "@/lib/medicare-proxy";

/**
 * POST /api/plans-search
 *
 * Proxies to Medicare.gov plans/search endpoint.
 * Query params: plan_type, year, zip, fips, page
 * Body: {} (empty) or { npis, prescriptions } for drug cost enrichment
 *
 * plan_type values:
 *   PLAN_TYPE_MAPD   – Medicare Advantage with drug coverage
 *   PLAN_TYPE_MA     – Medicare Advantage without drug coverage
 *   PLAN_TYPE_PDP    – Part D prescription drug plans
 */
export async function POST(request: NextRequest) {
  const planType = request.nextUrl.searchParams.get("plan_type");
  const zip = request.nextUrl.searchParams.get("zip");
  const fips = request.nextUrl.searchParams.get("fips");
  const year = request.nextUrl.searchParams.get("year") ?? "2026";
  const page = request.nextUrl.searchParams.get("page") ?? "0";

  if (!planType || !zip || !fips) {
    return NextResponse.json(
      { error: "plan_type, zip, and fips are required" },
      { status: 400 }
    );
  }

  const validTypes = ["PLAN_TYPE_MAPD", "PLAN_TYPE_MA", "PLAN_TYPE_PDP"];
  if (!validTypes.includes(planType)) {
    return NextResponse.json(
      { error: `Invalid plan_type. Valid: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const qs = new URLSearchParams({
      plan_type: planType,
      year,
      zip,
      fips,
      page,
    });

    // Forward the request body (may contain npis/prescriptions)
    let body = "{}";
    try {
      const incoming = await request.json();
      if (incoming && typeof incoming === "object" && !Array.isArray(incoming)) {
        delete (incoming as Record<string, unknown>).pharmacies;
      }
      body = JSON.stringify(incoming);
    } catch {
      // Empty body is fine
    }

    const path = `/plans/search?${qs.toString()}`;

    const upstream = await medicarePost(path, body);

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error("[plans-search] Upstream error:", upstream.status, errText.substring(0, 500));
      return NextResponse.json(
        { error: `Medicare plan search returned an error (${upstream.status})` },
        { status: 502 }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("[plans-search] Exception:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Failed to fetch plans" },
      { status: 502 }
    );
  }
}
