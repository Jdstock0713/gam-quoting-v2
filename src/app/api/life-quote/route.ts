import { NextRequest, NextResponse } from "next/server";
import { compulifeGet, getCompulifeAuthId } from "@/lib/compulife-proxy";

function validateDob(month: unknown, day: unknown, year: unknown): string | null {
  const m = Number(month);
  const d = Number(day);
  const y = Number(year);
  if (!Number.isInteger(m) || m < 1 || m > 12) return "Invalid birth month";
  if (!Number.isInteger(d) || d < 1 || d > 31) return "Invalid birth day";
  if (!Number.isInteger(y) || y < 1900 || y > new Date().getFullYear()) return "Invalid birth year";

  const dob = new Date(y, m - 1, d);
  if (dob.getMonth() !== m - 1 || dob.getDate() !== d) return "Invalid date";
  if (dob > new Date()) return "Birth date cannot be in the future";

  const age = (Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (age < 18) return "Must be at least 18 years old";
  if (age > 120) return "Invalid birth year";
  return null;
}

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
      requestType = "request",
      compInc,
      prodDis,
    } = body;

    const dobError = validateDob(birthMonth, birthDay, birthYear);
    if (dobError) {
      return NextResponse.json({ error: dobError }, { status: 400 });
    }

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
      console.error("[life-quote] Upstream error:", res.status, text.substring(0, 500));
      return NextResponse.json(
        { error: `Life quote service returned an error (${res.status})` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    console.error("[life-quote] Exception:", e instanceof Error ? e.message : e);
    return NextResponse.json(
      { error: "Failed to fetch life insurance quotes" },
      { status: 502 }
    );
  }
}
