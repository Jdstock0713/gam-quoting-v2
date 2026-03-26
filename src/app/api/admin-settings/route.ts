import { NextRequest, NextResponse } from "next/server";
import { getAdminSettings, updateAdminSettings } from "@/lib/supabase";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export async function GET() {
  try {
    const settings = await getAdminSettings();
    if (!settings) {
      return NextResponse.json({ error: "No settings found" }, { status: 404 });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { admin_password_hash: _hash, ...publicSettings } = settings;
    return NextResponse.json(publicSettings);
  } catch {
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Admin access is not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { password, ...updates } = body;

    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }

    const result = await updateAdminSettings(updates);
    if (!result) {
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { admin_password_hash: _hash2, ...publicSettings } = result;
    return NextResponse.json(publicSettings);
  } catch {
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
