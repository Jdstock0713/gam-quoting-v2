import { NextResponse } from "next/server";
import { compulifeGet } from "@/lib/compulife-proxy";

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

    const res = await compulifeGet("/CompanyLogoList/small/");

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
