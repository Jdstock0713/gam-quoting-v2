import { NextRequest, NextResponse } from "next/server";
import https from "https";

const MEDICARE_API_BASE = "https://www.medicare.gov/api/v1/data/plan-compare";
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  Accept: "application/json",
  "Fe-Ver": "2.64.0",
  Referer: "https://www.medicare.gov/medigap-supplemental-insurance-plans/",
  Origin: "https://www.medicare.gov",
};

function fetchMedicare(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${MEDICARE_API_BASE}${path}`);
    const req = https.request(
      url,
      { method: "GET", headers: HEADERS, timeout: 15000 },
      (res) => {
        let data = "";
        res.on("data", (chunk: Buffer) => (data += chunk));
        res.on("end", () => resolve(data));
      }
    );
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });
    req.on("error", reject);
    req.end();
  });
}

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
    const raw = await fetchMedicare(
      `/medigap/policies?state=${encodeURIComponent(state)}&zipcode=${encodeURIComponent(zipcode)}&medigap_plan_type=${encodeURIComponent(planType)}`
    );
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch medigap policies" },
      { status: 502 }
    );
  }
}
