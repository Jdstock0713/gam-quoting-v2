/**
 * Human-readable labels for Medicare.gov plan search enum strings
 * (SNP types, package_services availability codes, etc.).
 */

const SNP_LABELS: Record<string, string> = {
  SNP_TYPE_NOT_SNP: "Not a Special Needs Plan",
  SNP_TYPE_CHRONIC_CONDITION: "Chronic Condition Special Needs Plan (C-SNP)",
  SNP_TYPE_DUAL_ELIGIBLE: "Dual-Eligible Special Needs Plan (D-SNP)",
  SNP_TYPE_INSTITUTIONAL: "Institutional Special Needs Plan (I-SNP)",
};

/** Doctor choice, dental/vision/hearing/Rx package availability codes from CMS */
const AVAILABILITY_LABELS: Record<string, string> = {
  AVAILABILITY_PROVIDED: "Included",
  AVAILABILITY_NOT_PROVIDED: "Not included",
  AVAILABILITY_NOT_SPECIFIED: "Not specified",
  AVAILABILITY_ANY_DOCTOR: "Any doctor (follow plan network rules)",
  AVAILABILITY_IN_NETWORK: "In-network providers",
  AVAILABILITY_OUT_OF_NETWORK: "Out-of-network coverage (plan rules apply)",
  AVAILABILITY_REFERRAL_REQUIRED: "Referral may be required",
  AVAILABILITY_NO_REFERRAL: "No referral required",
};

function titleCaseUnderscores(code: string): string {
  return code
    .split("_")
    .filter(Boolean)
    .map((word) => {
      if (word.length === 1) return word;
      const lower = word.toLowerCase();
      if (lower === "snp") return "SNP";
      if (lower === "csnp") return "C-SNP";
      if (lower === "dsnp") return "D-SNP";
      if (lower === "isnp") return "I-SNP";
      return word.charAt(0) + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function stripPrefixHumanize(code: string, prefix: string): string {
  const rest = code.startsWith(prefix) ? code.slice(prefix.length) : code;
  return titleCaseUnderscores(rest);
}

/**
 * SNP row for extra-benefits UI. Returns null for standard (non-SNP) plans so the list stays short.
 */
export function labelSnpType(code: string | undefined | null): string | null {
  if (!code || !String(code).trim()) return null;
  const c = String(code).trim();
  if (c === "SNP_TYPE_NOT_SNP") return null;
  if (SNP_LABELS[c]) return SNP_LABELS[c];
  if (c.startsWith("SNP_TYPE_")) return stripPrefixHumanize(c, "SNP_TYPE_");
  return titleCaseUnderscores(c);
}

/** Package service / doctor-choice availability strings */
export function labelAvailabilityCode(code: string | undefined | null): string {
  if (!code || !String(code).trim()) return "";
  const c = String(code).trim();
  if (AVAILABILITY_LABELS[c]) return AVAILABILITY_LABELS[c];
  if (c.startsWith("AVAILABILITY_")) return stripPrefixHumanize(c, "AVAILABILITY_");
  return titleCaseUnderscores(c);
}
