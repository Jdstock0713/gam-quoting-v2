import { NextRequest, NextResponse } from "next/server";
import { compulifeGet, getCompulifeAuthId } from "@/lib/compulife-proxy";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      state,
      zipCode,
      birthMonth,
      birthDay,
      birthYear,
      gender,
      smoker,
      health,
      category,
      faceAmount,
      mode,
      requestType = "request", // "request" or "sidebyside"
      compInc,   // optional: comma-separated company codes to include
      prodDis,   // optional: comma-separated product codes to disable
    } = body;

    // Build the COMPULIFE JSON payload
    const compulifePayload: Record<string, string> = {
      COMPULIFEAUTHORIZATIONID: getCompulifeAuthId(),
      REMOTE_IP: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1",
      BirthMonth: birthMonth,
      Birthday: birthDay,
      BirthYear: birthYear,
      Sex: gender,
      Smoker: smoker,
      Health: health,
      NewCategory: category,
      FaceAmount: faceAmount,
      ModeUsed: mode,
      SortOverride1: "A",
      CompRating: "4",
      LANGUAGE: "E",
    };

    // State "0" means derive from ZIP
    if (zipCode) {
      compulifePayload.ZipCode = zipCode;
      compulifePayload.ErrOnMissingZipCode = "ON";
    }
    if (state && state !== "0") {
      compulifePayload.State = state;
    }

    // Optional filtering
    if (compInc) {
      compulifePayload.COMPINC = compInc;
    }
    if (prodDis) {
      compulifePayload.PRODDIS = prodDis;
    }

    const endpoint = requestType === "sidebyside" ? "sidebyside" : "request";
    const jsonStr = JSON.stringify(compulifePayload);
    const path = `/${endpoint}/?COMPULIFE=${encodeURIComponent(jsonStr)}`;

    const res = await compulifeGet(path);

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Compulife API error: ${res.status}`, details: text },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("Life quote API error:", e);
    return NextResponse.json(
      { error: "Failed to fetch life insurance quotes" },
      { status: 500 }
    );
  }
}
