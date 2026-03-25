# Life Insurance Compare Quotes — Test Report (Round 2)

> **Generated:** 2026-03-24 from manual testing on localhost:3000
> **Purpose:** Verification of BUG-0 fix and UX improvements from Round 1 report.
> **Result:** All critical bugs and UX improvements from Round 1 are **CONFIRMED FIXED**.

---

## Test Profile

- **State:** Michigan
- **DOB:** 06/15/1970 (age 55)
- **Gender:** Male
- **Tobacco:** No
- **Health Class:** Preferred Plus
- **Carrier tested:** Transamerica Life Insurance Company

---

## BUG-0: Snapshot ID Collision — FIXED ✅

### What was tested

The core use case: comparing the **same product** at different coverage amounts, insurance types, and health classes.

### Test procedure and results

**Step 1:** Set 20yr Level Term, $500,000, P+. Ran quotes. Added Transamerica Trendsetter Super 20 ($112.20/mo) to compare.

**Step 2:** Changed to 10yr Level Term, $500,000. Ran quotes.
- ✅ Transamerica Trendsetter Super 10 checkbox was **unchecked** (correct — different snapshot ID)
- ✅ Clicked Compare → **added** as a new snapshot (did not remove the $500k 20yr snapshot)

**Step 3:** Changed coverage to $250,000 (still 10yr). Ran quotes.
- ✅ Transamerica checkbox **unchecked** again
- ✅ Added as snapshot #3 ($38.46/mo)

**Step 4:** Changed coverage to $750,000 (still 10yr). Ran quotes.
- ✅ Transamerica checkbox **unchecked**
- ✅ Added as snapshot #4 ($98.18/mo)

**Step 5:** Changed coverage to $1,000,000 (still 10yr). Ran quotes.
- ✅ Transamerica checkbox **unchecked**
- ✅ Added as snapshot #5 ($124.95/mo)
- ✅ Other carriers' Compare buttons became **disabled/grayed out** (5-quote max enforced)

### 5-Column Comparison Modal

Opened the comparison modal with all 5 Transamerica snapshots. Verified:

| Column | Product | Term | Coverage | Monthly | Annual |
|--------|---------|------|----------|---------|--------|
| 1 | Trendsetter Super 20 | 20yr | $500,000 | $112.20 | $1,320.00 |
| 2 | Trendsetter Super 10 | 10yr | $500,000 | $66.30 | $780.00 |
| 3 | Trendsetter Super 10 | 10yr | $250,000 | $38.46 | $452.50 |
| 4 | Trendsetter Super 10 | 10yr | $750,000 | $98.18 | $1,155.00 |
| 5 | Trendsetter Super 10 | 10yr | $1,000,000 | $124.95 | $1,470.00 |

All premium data is correct and matches the individual quote cards.

---

## UX-1: Column Header Differentiators — IMPLEMENTED ✅

Each column header now shows a subtitle with the key differentiating parameters:

```
Transamerica Life Insurance Company
Preferred Plus · 20 Year Level Term · $500,000
```

This makes it immediately clear which column represents which quote configuration, even when all 5 columns are from the same carrier.

---

## UX-2: Row Highlighting for Differences — IMPLEMENTED ✅

Rows where values differ across columns are highlighted with an amber/yellow background. Verified:

- **Product row:** Highlighted (Trendsetter Super 20 vs Trendsetter Super 10)
- **Coverage amount row:** Highlighted ($500k, $500k, $250k, $750k, $1M)
- **Insurance type row:** Highlighted (20yr vs 10yr × 4)
- **Product/pay structure row:** Highlighted (20yr Term Guaranteed vs 10yr Term Guaranteed)
- **Premium rows:** All highlighted (different values)
- **Carrier row:** NOT highlighted (all same — correct)
- **Health class row:** NOT highlighted (all P+ — correct)
- **AM Best row:** NOT highlighted (all A — correct)
- **Gender, Tobacco, DOB rows:** NOT highlighted (all same — correct)

The highlighting logic correctly identifies which rows have differing values and only shades those.

---

## UX-3: Sidebar Display Improvement — IMPLEMENTED ✅

The compare sidebar now shows parameter tags under each entry:

```
Transamerica Life Insurance Company
Trendsetter Super 20
Preferred Plus · 20 Year Level Term · Saved at $500,000
```

Each sidebar entry is now distinguishable even when comparing the same carrier at different parameters.

---

## UX-4: Responsive Table — OBSERVATION

With 5 columns, the rightmost column is slightly clipped at the right edge of the modal on a 1552px-wide viewport. The table is still usable — all data is visible with a small horizontal scroll or by the modal expanding. On narrower screens this could be more noticeable.

**Recommendation:** Consider adding `overflow-x: auto` to the table container with a sticky first "Detail" column for better mobile/narrow-screen support. This is low priority since the modal is primarily used on desktop.

---

## Additional Observations

### What's Working Well

1. **`compareSnapshotId()` function** correctly generates unique IDs incorporating product identity AND request params (state, DOB, gender, smoker, health, category, faceAmount)
2. **Snapshot persistence across re-quotes** — changing form params and re-running quotes does not affect previously saved snapshots
3. **5-quote maximum** correctly enforced with disabled Compare buttons and "Maximum 5 quotes" message
4. **Print and Save as PDF** buttons work correctly in the comparison modal
5. **Quarterly and semi-annual premiums** correctly show "—" when not available from the API
6. **AM Best ratings** displayed with full detail (e.g., "A (AMB # 06095 A (2-13-26))")
7. **Modal explanatory text** clearly states that rows with differences are shaded

### No New Bugs Found

All features tested are working as expected. The compare quotes feature is production-ready for the cross-parameter comparison use case.

---

## Key Files (Reference)

| File | Purpose |
|------|---------|
| `src/components/LifeInsuranceResults.tsx` | Parent component — `compareSnapshotId()`, `toggleCompareFromCard()`, checkbox logic, sidebar rendering |
| `src/components/LifeCompareModal.tsx` | Comparison modal — table rendering, column headers with differentiators, row highlighting |
| `src/components/LifeInsuranceForm.tsx` | Quote input form — builds `LifeQuoteRequest` |
| `src/types/index.ts` | `LifeQuoteRequest`, `LifeQuoteResult` types |

---

## Summary

| Item | Status |
|------|--------|
| BUG-0: Snapshot ID Collision | ✅ FIXED |
| UX-1: Column Header Differentiators | ✅ IMPLEMENTED |
| UX-2: Row Highlighting | ✅ IMPLEMENTED |
| UX-3: Sidebar Display | ✅ IMPLEMENTED |
| UX-4: Responsive Table | ⚠️ Minor clipping at 5 columns on standard viewport — low priority |
