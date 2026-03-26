# Project State

This file is the source of truth for approved implementation decisions in this repository.

## Approved Decisions

### 2026-03-25 — Add reusable Cursor Security Subagent prompt
- **Decision:** Add a reusable Cursor subagent prompt dedicated to full-application security audits.
- **Purpose:** Standardize repeatable security reviews with consistent severity-based reporting.
- **Artifact:** `.cursor/agents/security-agent-quoting-audit.md`
- **Constraints:** Prioritize secrets/credential scanning first, then run all audit phases sequentially, and include exact file/line citations and concrete fixes.

### 2026-03-25 — Security hardening pass (audit remediation)
- **Decision:** Implement all actionable findings from the security audit.
- **Changes applied:**
  - **CRITICAL:** Admin password moved from `NEXT_PUBLIC_ADMIN_PASSWORD` (with hardcoded fallback) to server-only `ADMIN_PASSWORD` env var with no default. Route returns 503 if unconfigured.
  - **HIGH:** All proxy API routes (`life-quote`, `plans-search`, `plan-detail`, `counties`) no longer return upstream error bodies to clients; errors are logged server-side only.
  - **HIGH:** `postMessage` handler in `page.tsx` now validates `event.origin` against Wix domain allowlist.
  - **HIGH:** `/api/debug-ip` returns 404 in production and no longer exposes `proxy_url`.
  - **MEDIUM:** New `src/middleware.ts` sets security headers on all responses (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy).
  - **MEDIUM:** `/api/life-quote` now validates DOB server-side (month, day, year ranges, age 18-120, no future dates).
  - **MEDIUM:** Removed all `http://127.0.0.1:7787` debug ingest calls and agent log scaffolding from `ZipEntry.tsx` and `counties/route.ts`.
  - **MEDIUM:** `eslint.ignoreDuringBuilds` removed from `next.config.mjs`.
  - **MEDIUM:** `getCompulifeAuthId()` now throws if `COMPULIFE_AUTH_ID` is not set (no hardcoded fallback).
  - **LOW:** `.gitignore` expanded with `*.key`, `*.p12`, `*.pfx`, `/dist`, `.env` / `.env.*`, `debug-*.log`.
  - **INFO:** `.env.example` created with placeholder values for all required env vars.
- **Remaining:**
  - `package-lock.json` generation blocked by npm arborist bug with `unrs-resolver`; needs manual resolution.
  - Browser-side verification of headers (Cowork task).

### 2026-03-26 — Responsive design audit remediation
- **Decision:** Implement all 12 responsive layout fixes from the mobile/tablet/desktop audit (no new features, layout/styling only).
- **Changes applied:**
  - **CRITICAL:** Results pages (`MedigapResults`, `MAResults`, `PDPResults`, `LifeInsuranceResults`) now activate sidebar layout at `md:` (768px) instead of `lg:` (1024px), eliminating the tablet dead zone.
  - **HIGH:** Logo in `page.tsx` scales progressively (`h-20 sm:h-28 md:h-32 lg:h-40`) instead of fixed `h-40`.
  - **HIGH:** Pagination across all results pages (`QuoteList`, `MAResults`, `PDPResults`) uses `flex-wrap`, hides "First"/"Last" on mobile (`hidden sm:inline-flex`), and adds `min-h-[44px]` touch targets.
  - **HIGH:** Touch targets on `QuoteCard` action buttons ("View Details", "Carrier Info") increased to 44px minimum.
  - **MEDIUM:** `ZipEntry` card uses progressive padding (`p-4 sm:p-6 lg:p-8`).
  - **MEDIUM:** `QuoteForm` ZIP/Age/Gender grid stacks on narrow screens (`grid-cols-1 sm:grid-cols-2`).
  - **MEDIUM:** `MedigapResults` header stacks vertically on mobile (`flex-col sm:flex-row`).
  - **MEDIUM:** `ComparisonView` table uses `text-xs sm:text-sm` and carrier names truncate on mobile.
  - **LOW:** Responsive text sizing on key headings (`text-xl sm:text-2xl`, `text-lg sm:text-xl`).
  - **LOW:** `CarrierSettings` repositioned below results on mobile (hidden in sidebar, shown via `md:hidden` block after results).
  - **LOW:** `QuoteCard` carrier name container uses `flex-wrap` with `line-clamp-2 sm:line-clamp-none`.
  - **INFO:** Viewport meta tag (`width=device-width, initial-scale=1`) already present in `layout.tsx` — no change needed.
