/**
 * Cloudflare Worker — Medicare.gov API Proxy
 *
 * Proxies requests from Vercel to Medicare.gov's API since Medicare.gov
 * blocks requests from Vercel's cloud IP ranges.
 *
 * Deploy: npx wrangler deploy
 *
 * Usage from Vercel routes:
 *   GET  https://<worker>.workers.dev/geography/counties?zipcode=48383
 *   POST https://<worker>.workers.dev/plans/search?plan_type=medigap&...
 */

const MEDICARE_API_BASE = "https://www.medicare.gov/api/v1/data/plan-compare";

const MEDICARE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Fe-Ver": "2.64.0",
  Referer: "https://www.medicare.gov/medigap-supplemental-insurance-plans/",
  Origin: "https://www.medicare.gov",
};

// Optional: restrict to your Vercel project's domains
const ALLOWED_ORIGINS = [
  "https://quoting.goldenagemarketing.com",
  "https://gam-quoting.vercel.app",
  "http://localhost:3000",
];

function corsHeaders(origin) {
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request.headers.get("Origin") || ""),
      });
    }

    const url = new URL(request.url);
    const path = url.pathname; // e.g. /geography/counties
    const search = url.search; // e.g. ?zipcode=48383

    // Health check
    if (path === "/" || path === "/health") {
      return Response.json({ status: "ok", proxy: "medicare-gov" });
    }

    // Build the Medicare.gov URL
    const medicareUrl = `${MEDICARE_API_BASE}${path}${search}`;

    // Build fetch options
    const fetchOpts = {
      method: request.method,
      headers: { ...MEDICARE_HEADERS },
    };

    // Forward POST body and content-type
    if (request.method === "POST") {
      fetchOpts.headers["Content-Type"] = "application/json";
      fetchOpts.body = await request.text();
    }

    try {
      const res = await fetch(medicareUrl, fetchOpts);

      // Stream the response back with CORS headers
      const responseHeaders = new Headers(res.headers);
      const cors = corsHeaders(request.headers.get("Origin") || "");
      for (const [k, v] of Object.entries(cors)) {
        responseHeaders.set(k, v);
      }

      return new Response(res.body, {
        status: res.status,
        headers: responseHeaders,
      });
    } catch (err) {
      return Response.json(
        { error: "Medicare.gov proxy error", details: err.message },
        {
          status: 502,
          headers: corsHeaders(request.headers.get("Origin") || ""),
        }
      );
    }
  },
};
