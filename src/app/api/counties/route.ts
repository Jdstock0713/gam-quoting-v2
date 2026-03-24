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

export async function GET(request: NextRequest) {
  const zipcode = request.nextUrl.searchParams.get("zipcode");
  if (!zipcode) {
    return NextResponse.json({ error: "zipcode is required" }, { status: 400 });
  }

  try {
    const raw = await fetchMedicare(
      `/geography/counties?zipcode=${encodeURIComponent(zipcode)}`
    );
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch county data" },
      { status: 502 }
    );
  }
}
