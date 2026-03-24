import { NextResponse } from "next/server";

const COMPULIFE_API_BASE = "https://www.compulifeapi.com/api";

export async function GET() {
  try {
    const res = await fetch(`${COMPULIFE_API_BASE}/CompanyList/`, {
      headers: {
        "User-Agent": "GoldenAgeQuoting/1.0",
        Accept: "*/*",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Compulife API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Life companies API error:", e);
    return NextResponse.json(
      { error: "Failed to fetch life insurance companies" },
      { status: 500 }
    );
  }
}
