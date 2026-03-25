import { NextResponse } from "next/server";
import { compulifeGet } from "@/lib/compulife-proxy";

export async function GET() {
  try {
    const res = await compulifeGet("/CompanyList/");

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
