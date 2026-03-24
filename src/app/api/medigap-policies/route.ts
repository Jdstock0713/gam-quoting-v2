import { NextRequest, NextResponse } from "next/server";
import { medicareGet } from "@/lib/medicare-proxy";

// Map plan letters to Medicare.gov plan type enum
const PLAN_TYPE_MAP: Record<string, string> = {
  A: "MEDIGAP_PLAN_TYPE_A",
  B: "MEDIGAP_PLAN_TYPE_B",
  C: "MEDIGAP_PLAN_TYPE_C",
  D: "MEDIGAP_PLAN_TYPE_D",
  F: "MEDIGAP_PLAN_TYPE_F",
  "HIGH F": "MEDIGAP_PLAN_TYPE_HIGH_F",
  G: "MEDIGAP_PLAN_TYPE_G",
  "HIGH G": "MEDIGAP_PLAN_TYPE_HIGH_G",
  K: "MEDIGAP_PLAN_TYPE_K",
  L: "MEDIGAP_PLAN_TYPE_L",
  M: "MEDIGAP_PLAN_TYPE_M",
  N: "MEDIGAP_PLAN_TYPE_N",
};

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get("state");
  const zipcode = request.nextUrl.searchParams.get("zipcode");
  const plan = request.nextUrl.searchParams.get("plan");

  if (!state || !zipcode || !plan) {
    return NextResponse.json(
      { error: "state, zipcode, and plan are required" },
      { status: 400 }
    );
  }

  const planType = PLAN_TYPE_MAP[plan.toUpperCase()];
  if (!planType) {
    return NextResponse.json(
      { error: `Invalid plan: ${plan}. Valid plans: ${Object.keys(PLAN_TYPE_MAP).join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const res = await medicareGet(
      `/medigap/policies?state=${encodeURIComponent(state)}&zipcode=${encodeURIComponent(zipcode)}&medigap_plan_type=${encodeURIComponent(planType)}`
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
      { error: "Failed to fetch medigap policies", details: msg },
      { status: 502 }
    );
  }
}
