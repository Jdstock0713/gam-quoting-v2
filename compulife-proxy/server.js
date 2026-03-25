const express = require("express");
const app = express();
const PORT = process.env.PORT || 3002;

const COMPULIFE_API_BASE = "https://www.compulifeapi.com/api";

const ALLOWED_ORIGINS = [
  "https://quoting.goldenagemarketing.com",
  "https://gam-quoting.vercel.app",
  "http://localhost:3000",
];

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  res.set("Access-Control-Allow-Origin", allowedOrigin);
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  next();
});

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", proxy: "compulife" });
});
app.get("/health", (req, res) => {
  res.json({ status: "ok", proxy: "compulife" });
});

// Report this server's outbound IP (what Compulife sees)
app.get("/ip", async (req, res) => {
  try {
    const response = await fetch(`${COMPULIFE_API_BASE}/ip/`);
    const data = await response.text();
    res.set("Content-Type", response.headers.get("Content-Type") || "text/plain").send(data);
  } catch (err) {
    res.status(502).json({ error: "Failed to check IP", details: err.message });
  }
});

/**
 * Proxy all other routes to Compulife API.
 *
 * The Vercel app sends requests like:
 *   GET /request/?COMPULIFE=...
 *   GET /CompanyList/
 *   GET /CompanyLogoList/small/
 *
 * This proxy prepends the Compulife base URL and forwards them.
 */
app.all("/*", async (req, res) => {
  const path = req.originalUrl; // includes query string
  const compulifeUrl = `${COMPULIFE_API_BASE}${path}`;

  const fetchOpts = {
    method: req.method,
    headers: {
      "User-Agent": "GoldenAgeQuoting/1.0",
      Accept: "*/*",
    },
  };

  if (req.method === "POST" && req.body) {
    fetchOpts.headers["Content-Type"] = "application/json";
    fetchOpts.body = JSON.stringify(req.body);
  }

  try {
    const response = await fetch(compulifeUrl, fetchOpts);
    const body = await response.text();
    res
      .status(response.status)
      .set("Content-Type", response.headers.get("Content-Type") || "application/json")
      .send(body);
  } catch (err) {
    console.error("Compulife proxy error:", err.message);
    res.status(502).json({
      error: "Compulife proxy error",
      details: err.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Compulife proxy running on port ${PORT}`);
});
