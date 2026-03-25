import type { PDPPlanDetail, DrugCoverageRow } from "@/types";
import { pickDetail, cellString } from "./maPlanDetailParse";

/** Extract drug formulary / tier hints from PDP plan detail. */
export function extractDrugFormulary(d: PDPPlanDetail): {
  tieredCosts?: { tier: string; cost: string }[];
  gapCoverage?: string;
  catastrophicCoverage?: string;
} {
  const tiers = pickDetail(d, ["drug_tiers", "drugTiers", "formulary_tiers", "drug_costs"]);
  const gap = pickDetail(d, ["gap_coverage", "gapCoverage", "coverage_gap", "donut_hole"]);
  const catastrophic = pickDetail(d, ["catastrophic_coverage", "catastrophicCoverage"]);

  let tieredCosts: { tier: string; cost: string }[] | undefined;
  if (Array.isArray(tiers)) {
    tieredCosts = tiers.map((t) => {
      if (!t || typeof t !== "object") return { tier: "—", cost: cellString(t, 80) };
      const o = t as Record<string, unknown>;
      return {
        tier: cellString(o.name ?? o.tier ?? o.tier_name, 80),
        cost: cellString(o.cost ?? o.copay ?? o.amount, 80),
      };
    });
  }

  return {
    tieredCosts,
    gapCoverage: gap !== undefined ? cellString(gap, 400) : undefined,
    catastrophicCoverage: catastrophic !== undefined ? cellString(catastrophic, 400) : undefined,
  };
}

/** Mail order / preferred network flags when present on detail. */
export function extractPharmacyDetails(d: PDPPlanDetail): {
  mailOrder90Day?: boolean;
  preferredPharmacyNetwork?: boolean;
} {
  const mail = pickDetail(d, ["mail_order", "mailOrder", "mail_order_pharmacy", "mail_order_90"]);
  const pref = pickDetail(d, ["preferred_pharmacy", "preferredPharmacy", "preferred_pharmacy_network"]);

  return {
    mailOrder90Day: typeof mail === "boolean" ? mail : undefined,
    preferredPharmacyNetwork: typeof pref === "boolean" ? pref : undefined,
  };
}

/** Free-text drug section from detail (same keys as MA drug blob). */
export function extractPDPDrugSection(d: PDPPlanDetail): string {
  const v = pickDetail(d, [
    "drug_coverage",
    "drugCoverage",
    "pharmacy_costs",
    "pharmacyCosts",
    "estimated_drug_costs",
    "prescription_benefits",
  ]);
  return v !== undefined ? cellString(v, 600) : "";
}

/** Check which of the user's entered drugs are covered by the PDP plan's formulary. */
export function extractPDPDrugCoverageStatus(
  planDetail: PDPPlanDetail,
  drugNames: string[]
): DrugCoverageRow[] {
  if (!drugNames.length) return [];
  const formulary = pickDetail(planDetail, [
    "formulary",
    "drug_coverage",
    "drugCoverage",
    "covered_drugs",
    "drugs_covered",
    "formulary_drugs",
  ]);
  const formularyList = Array.isArray(formulary) ? formulary : [];

  return drugNames.map((name) => {
    const lower = name.toLowerCase().replace(/\s+/g, " ").trim();
    let found: Record<string, unknown> | null = null;

    for (const item of formularyList) {
      if (!item || typeof item !== "object") continue;
      const o = item as Record<string, unknown>;
      const drugName = String(o.name ?? o.drug_name ?? o.drugName ?? "").toLowerCase();
      if (drugName.includes(lower) || lower.includes(drugName.split(" ")[0])) {
        found = o;
        break;
      }
    }

    if (found) {
      const tier = cellString(found.tier ?? found.tier_name ?? found.drug_tier, 40);
      const restrictions = cellString(found.restrictions ?? found.prior_auth ?? found.quantity_limit, 60);
      return {
        drugName: name,
        covered: true,
        tier: tier !== "—" ? tier : undefined,
        restrictions: restrictions !== "—" ? restrictions : undefined,
      };
    }

    return { drugName: name, covered: formularyList.length === 0, tier: undefined, restrictions: undefined };
  });
}
