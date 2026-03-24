/**
 * Shared helper for Medicare.gov API calls.
 *
 * Routes through a Cloudflare Worker proxy (set MEDICARE_PROXY_URL env var)
 * to avoid Medicare.gov blocking Vercel's cloud IPs.
 *
 * If MEDICARE_PROXY_URL is not set, falls back to direct Medicare.gov calls
 * (which will only work from non-blocked IPs like localhost).
 */

const DIRECT_MEDICARE_BASE = "https://www.medicare.gov/api/v1/data/plan-compare";

const DIRECT_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Fe-Ver": "2.64.0",
  Referer: "https://www.medicare.gov/medigap-supplemental-insurance-plans/",
  Origin: "https://www.medicare.gov",
};

function getBaseUrl(): string {
  return process.env.MEDICARE_PROXY_URL || DIRECT_MEDICARE_BASE;
}

function isUsingProxy(): boolean {
  return !!process.env.MEDICARE_PROXY_URL;
}

/**
 * GET request to Medicare.gov (via proxy if configured).
 */
export async function medicareGet(path: string, timeoutMs = 15000): Promise<Response> {
  const base = getBaseUrl();
  const url = `${base}${path}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: isUsingProxy() ? { Accept: "application/json" } : DIRECT_HEADERS,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * POST request to Medicare.gov (via proxy if configured).
 */
export async function medicarePost(
  path: string,
  body: string,
  timeoutMs = 20000
): Promise<Response> {
  const base = getBaseUrl();
  const url = `${base}${path}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: isUsingProxy()
        ? { "Content-Type": "application/json", Accept: "application/json" }
        : { ...DIRECT_HEADERS, "Content-Type": "application/json" },
      body,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeout);
  }
}
