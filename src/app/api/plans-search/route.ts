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
      body = JSON.stringify(incoming);
    } catch {
      // Empty body is fine
    }

    const upstreamUrl = `${MEDICARE_API_BASE}/plans/search?${qs.toString()}`;
    console.log("[plans-search] Upstream URL:", upstreamUrl);
    console.log("[plans-search] Body:", body);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    let upstream: Response;
    try {
      upstream = await fetch(upstreamUrl, {
        method: "POST",
        headers: HEADERS,
        body,
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      console.error("[plans-search] Fetch failed:", msg);

      // If it was an abort/timeout, try again with empty body in case body format is wrong
      if (msg.includes("abort")) {
        return NextResponse.json(
          { error: `Request to Medicare.gov timed out after 20s`, detail: msg },
          { status: 504 }
        );
      }
      return NextResponse.json(
        { error: `Network error calling Medicare.gov: ${msg}` },
        { status: 502 }
      );
    }

    clearTimeout(timeout);

    console.log("[plans-search] Upstream status:", upstream.status);
    console.log("[plans-search] Upstream headers:", Object.fromEntries(upstream.headers.entries()));

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error("[plans-search] Upstream error body:", errText.substring(0, 1000));
      return NextResponse.json(
        { error: `Medicare.gov returned ${upstream.status}`, detail: errText.substring(0, 1000) },
        { status: 502 }
      );
    }

    const data = await upstream.json();
    console.log("[plans-search] Got plans:", data.plans?.length ?? 0);
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[plans-search] Exception:", msg);
    return NextResponse.json(
      { error: `Failed to fetch plans: ${msg}` },
      { status: 502 }
    );
  }
}
