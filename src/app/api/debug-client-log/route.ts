import { NextRequest, NextResponse } from "next/server";
import {
  appendDebugSessionLog,
  isDebugSessionFileEnabled,
} from "@/lib/debug-session-log";

/** Append client debug lines when session file logging is enabled (dev or DEBUG_SESSION_LOG=1). */
export async function POST(req: NextRequest) {
  if (!isDebugSessionFileEnabled()) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }
  try {
    const body = await req.json();
    appendDebugSessionLog({ source: "debug-client-log", ...body });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
