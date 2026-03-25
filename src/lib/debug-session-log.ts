import { appendFileSync } from "fs";
import { join } from "path";

const DEBUG_LOG_FILENAME = "debug-0abe76.log";

/** True when we should write the Cursor session NDJSON file (dev, or explicit opt-in). */
export function isDebugSessionFileEnabled(): boolean {
  if (process.env.DEBUG_SESSION_LOG === "1") return true;
  return process.env.NODE_ENV !== "production";
}

/** Append one NDJSON line at project cwd when session file logging is enabled. */
export function appendDebugSessionLog(payload: Record<string, unknown>): void {
  if (!isDebugSessionFileEnabled()) return;
  const path = join(process.cwd(), DEBUG_LOG_FILENAME);
  try {
    const line =
      JSON.stringify({ ...payload, receivedAtServer: Date.now() }) + "\n";
    appendFileSync(path, line, "utf8");
  } catch (e) {
    console.error("[debug-session-log] append failed:", path, e);
  }
}
