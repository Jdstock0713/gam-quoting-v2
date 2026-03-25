import { NextRequest, NextResponse } from "next/server";
import { medicareGet } from "@/lib/medicare-proxy";

/**
 * GET /api/plan-detail?year=2026&contract_id=H2354&plan_id=015&segment_id=0
 *
 * Proxies Medicare.gov:
 *   GET /plan/{year}/{contract_id}/{plan_id}/{segment_id}
 */
export async function GET(request: NextRequest) {
  const year = request.nextUrl.searchParams.get("year") ?? "2026";
  const contractId = request.nextUrl.searchParams.get("contract_id");
  const planId = request.nextUrl.searchParams.get("plan_id");
  const segmentId = request.nextUrl.searchParams.get("segment_id");

  if (!contractId || !planId || segmentId === null || segmentId === "") {
    return NextResponse.json(
      { error: "contract_id, plan_id, and segment_id are required" },
      { status: 400 }
    );
  }

  const path = `/plan/${encodeURIComponent(year)}/${encodeURIComponent(contractId)}/${encodeURIComponent(planId)}/${encodeURIComponent(segmentId)}`;

  try {
    const upstream = await medicareGet(path);

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error("[plan-detail] Upstream error:", upstream.status, errText.substring(0, 500));
      return NextResponse.json(
        {
          error: `Medicare.gov returned ${upstream.status}`,
          detail: errText.substring(0, 1000),
        },
        { status: 502 }
      );
    }

    const data = await upstream.json();
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("[plan-detail] Exception:", msg);
    return NextResponse.json(
      { error: `Failed to fetch plan detail: ${msg}` },
      { status: 502 }
    );
  }
}
