import { NextResponse } from "next/server";

const COMPULIFE_API_BASE = "https://www.compulifeapi.com/api";

// Cache logos in memory since they rarely change
let cachedLogos: Record<string, string> | null = null;
let cacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function GET() {
  try {
    const now = Date.now();
    if (cachedLogos && now - cacheTime < CACHE_TTL) {
      return NextResponse.json(cachedLogos);
    }

    const res = await fetch(`${COMPULIFE_API_BASE}/CompanyLogoList/small/`, {
      headers: {
        "User-Agent": "Mozilla/5.0 GoldenAgeQuoting/1.0",
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
    cachedLogos = data;
    cacheTime = now;
    return NextResponse.json(data);
  } catch (e) {
    console.error("Life logos API error:", e);
    return NextResponse.json(
      { error: "Failed to fetch company logos" },
      { status: 500 }
    );
  }
}
