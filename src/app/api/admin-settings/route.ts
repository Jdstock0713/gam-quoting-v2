import { NextRequest, NextResponse } from "next/server";
import { getAdminSettings, updateAdminSettings } from "@/lib/supabase";

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "goldenage2026";

export async function GET() {
  try {
    const settings = await getAdminSettings();
    if (!settings) {
      return NextResponse.json({ error: "No settings found" }, { status: 404 });
    }
    // Strip password hash from public response
    const { admin_password_hash: _hash, ...publicSettings } = settings;
    return NextResponse.json(publicSettings);
  } catch (e) {
    console.error("Admin settings GET error:", e);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { password, ...updates } = body;

    // Simple password check
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const result = await updateAdminSettings(updates);
    if (!result) {
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }

    const { admin_password_hash: _hash2, ...publicSettings } = result;
    return NextResponse.json(publicSettings);
  } catch (e) {
    console.error("Admin settings PATCH error:", e);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
