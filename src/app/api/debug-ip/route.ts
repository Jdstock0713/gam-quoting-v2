import { NextResponse } from "next/server";
import { compulifeGet } from "@/lib/compulife-proxy";

export async function GET() {
  try {
    const res = await compulifeGet("/ip/");

    if (!res.ok) {
      return NextResponse.json(
        { error: `Compulife API error: ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const usingProxy = !!process.env.COMPULIFE_PROXY_URL;

    return NextResponse.json({
      message: usingProxy
        ? "IP reported via Render proxy (this is the IP Compulife has on file)"
        : "IP reported directly from this server (no proxy configured)",
      using_proxy: usingProxy,
      proxy_url: usingProxy ? process.env.COMPULIFE_PROXY_URL : null,
      compulife_response: data,
    });
  } catch (e) {
    console.error("Debug IP error:", e);
    return NextResponse.json(
      { error: "Failed to fetch IP from Compulife" },
      { status: 500 }
    );
  }
}
