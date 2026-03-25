import { NextRequest, NextResponse } from "next/server";
import { appendDebugSessionLog } from "@/lib/debug-session-log";
import { medicareGet } from "@/lib/medicare-proxy";

// #region agent log
function dbgApi(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string
) {
  void fetch("http://127.0.0.1:7787/ingest/3f234bfc-a343-4891-ab87-dfc2801c4edd", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "0abe76",
    },
    body: JSON.stringify({
      sessionId: "0abe76",
      location,
      message,
      data,
      timestamp: Date.now(),
      hypothesisId,
      runId: "post-fix",
    }),
  }).catch(() => {});
}
// #endregion

export async function GET(request: NextRequest) {
  const zipcode = request.nextUrl.searchParams.get("zipcode");
  // #region agent log
  appendDebugSessionLog({
    sessionId: "0abe76",
    source: "counties-GET",
    location: "counties/route.ts:GET",
    message: "counties request",
    hypothesisId: "H4",
    runId: "post-fix3",
    zipcodeLen: zipcode?.length ?? 0,
  });
  dbgApi(
    "counties/route.ts:GET",
    "counties request",
    { zipcodeLen: zipcode?.length ?? 0 },
    "H4"
  );
  // #endregion
  if (!zipcode) {
    return NextResponse.json({ error: "zipcode is required" }, { status: 400 });
  }

  try {
    const res = await medicareGet(
      `/geography/counties?zipcode=${encodeURIComponent(zipcode)}`
    );

    if (!res.ok) {
      // #region agent log
      appendDebugSessionLog({
        sessionId: "0abe76",
        source: "counties-medicare",
        location: "counties/route.ts:medicareNotOk",
        message: "medicareGet non-OK",
        hypothesisId: "H4",
        runId: "post-fix3",
        status: res.status,
      });
      dbgApi(
        "counties/route.ts:medicareNotOk",
        "medicareGet non-OK",
        { status: res.status },
        "H4"
      );
      // #endregion
      const text = await res.text();
      return NextResponse.json(
        { error: `Medicare.gov returned ${res.status}`, details: text },
        { status: 502 }
      );
    }

    const data = await res.json();
    // #region agent log
    const countyCount = Array.isArray(data?.counties) ? data.counties.length : -1;
    appendDebugSessionLog({
      sessionId: "0abe76",
      source: "counties-success",
      location: "counties/route.ts:success",
      message: "counties ok",
      hypothesisId: "H4",
      runId: "post-fix3",
      countyCount,
    });
    dbgApi(
      "counties/route.ts:success",
      "counties ok",
      { countyCount },
      "H4"
    );
    // #endregion
    return NextResponse.json(data);
  } catch (e) {
    // #region agent log
    appendDebugSessionLog({
      sessionId: "0abe76",
      source: "counties-catch",
      location: "counties/route.ts:catch",
      message: "counties route error",
      hypothesisId: "H4",
      runId: "post-fix3",
      errMessage: e instanceof Error ? e.message : String(e),
    });
    dbgApi(
      "counties/route.ts:catch",
      "counties route error",
      {
        message: e instanceof Error ? e.message : String(e),
      },
      "H4"
    );
    // #endregion
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to fetch county data", details: msg },
      { status: 502 }
    );
  }
}
