import { NextResponse } from "next/server";
import { compulifeGet } from "@/lib/compulife-proxy";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  try {
    const res = await compulifeGet("/ip/");

    if (!res.ok) {
      return NextResponse.json(
        { error: `Compulife API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({
      using_proxy: !!process.env.COMPULIFE_PROXY_URL,
      compulife_response: data,
    });
  } catch (e) {
    console.error("[debug-ip] Error:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Failed to fetch IP from Compulife" },
      { status: 500 }
    );
  }
}
