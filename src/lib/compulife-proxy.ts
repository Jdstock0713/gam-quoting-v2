/**
 * Shared helper for Compulife API calls.
 *
 * Routes through a Render.com proxy (set COMPULIFE_PROXY_URL env var)
 * so that all outbound requests come from a static IP that Compulife
 * has whitelisted for auth ID.
 *
 * If COMPULIFE_PROXY_URL is not set, falls back to direct Compulife calls
 * (works for local dev if your machine's IP is whitelisted, or for testing).
 *
 * Timeout is set to 45s because Render free tier cold-starts can take ~30s.
 */

const DIRECT_COMPULIFE_BASE = "https://www.compulifeapi.com/api";

function getBaseUrl(): string {
  return process.env.COMPULIFE_PROXY_URL || DIRECT_COMPULIFE_BASE;
}

/**
 * GET request to Compulife API (via proxy if configured).
 *
 * @param path - e.g. "/request/?COMPULIFE=..." or "/CompanyList/"
 */
export async function compulifeGet(
  path: string,
  timeoutMs = 45000
): Promise<Response> {
  const base = getBaseUrl();
  const url = `${base}${path}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": "GoldenAgeQuoting/1.0",
        Accept: "*/*",
      },
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

export function getCompulifeAuthId(): string {
  const id = process.env.COMPULIFE_AUTH_ID;
  if (!id) {
    throw new Error("COMPULIFE_AUTH_ID environment variable is required");
  }
  return id;
}
