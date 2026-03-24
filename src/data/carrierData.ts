/**
 * Carrier financial data sourced from:
 * - NAIC 2024 Medicare Supplement Loss Ratios Report (Total Individual Policies)
 * - AM Best Financial Strength Ratings (as of early 2026)
 *
 * NAIC data: premiums, claims, loss ratios, lives covered, market share
 * AM Best: financial strength ratings and outlook
 *
 * This data is keyed by carrier name as returned by the Medicare.gov API.
 * Fuzzy matching is used in getCarrierData() for carriers not listed exactly.
 */

export type CarrierInfo = {
  parentCompany: string;
  amBestRating: string;
  amBestOutlook: string;
  naicPremiumsEarned?: number;
  naicClaimsIncurred?: number;
  naicLossRatio?: number;
  naicLivesCovered?: number;
  naicMarketShare?: number;
};

const CARRIER_DATA: Record<string, CarrierInfo> = {
  "AARP - UnitedHealthcare Insurance Company": {
    parentCompany: "UnitedHealth Group",
    amBestRating: "A",
    amBestOutlook: "Stable",
    naicPremiumsEarned: 3410207341,
    naicClaimsIncurred: 2743118217,
    naicLossRatio: 80.4,
    naicLivesCovered: 1059892,
    naicMarketShare: 12.292,
  },
  "Humana Achieve (CompBenefits Insurance Company)": {
    parentCompany: "Humana Inc.",
    amBestRating: "A",
    amBestOutlook: "Stable",
    naicPremiumsEarned: 398512816,
    naicClaimsIncurred: 306932690,
    naicLossRatio: 77.0,
    naicLivesCovered: 126411,
    naicMarketShare: 1.436,
  },
  "Humana (Humana Insurance Company of Kentucky)": {
    parentCompany: "Humana Inc.",
    amBestRating: "A",
    amBestOutlook: "Stable",
    naicPremiumsEarned: 35204571,
    naicClaimsIncurred: 34336167,
    naicLossRatio: 97.5,
    naicLivesCovered: 31176,
    naicMarketShare: 0.127,
  },
  "Blue Cross Blue Shield of Michigan (Guaranteed Issue)": {
    parentCompany: "BCBSM Inc.",
    amBestRating: "A",
    amBestOutlook: "Stable",
    naicPremiumsEarned: 313182411,
    naicClaimsIncurred: 270156558,
    naicLossRatio: 86.3,
    naicLivesCovered: 95351,
    naicMarketShare: 1.129,
  },
  "Blue Cross Blue Shield of Michigan (Non-Guaranteed Issue)": {
    parentCompany: "BCBSM Inc.",
    amBestRating: "A",
    amBestOutlook: "Stable",
    naicPremiumsEarned: 313182411,
    naicClaimsIncurred: 270156558,
    naicLossRatio: 86.3,
    naicLivesCovered: 95351,
    naicMarketShare: 1.129,
  },
  "Mutual of Omaha (Omaha Supplemental Insurance Company)": {
    parentCompany: "Mutual of Omaha",
    amBestRating: "A+",
    amBestOutlook: "Stable",
    naicPremiumsEarned: 161514104,
    naicClaimsIncurred: 157397933,
    naicLossRatio: 97.5,
    naicLivesCovered: 93936,
    naicMarketShare: 0.582,
  },
  "SilverScript Insurance Company": {
    parentCompany: "CVS Health / Aetna",
    amBestRating: "A",
    amBestOutlook: "Stable",
  },
  "Continental Life Insurance Company of Brentwood, Tennessee (Aetna)": {
    parentCompany: "CVS Health / Aetna",
    amBestRating: "A",
    amBestOutlook: "Stable",
    naicPremiumsEarned: 616110302,
    naicClaimsIncurred: 533465919,
    naicLossRatio: 86.6,
    naicLivesCovered: 232490,
    naicMarketShare: 2.221,
  },
  "State Farm Mutual Automobile Insurance Company": {
    parentCompany: "State Farm",
    amBestRating: "A++",
    amBestOutlook: "Stable",
    naicPremiumsEarned: 306573722,
    naicClaimsIncurred: 253548453,
    naicLossRatio: 82.7,
    naicLivesCovered: 103874,
    naicMarketShare: 1.105,
  },
  "Medico Life and Health Insurance Company (Preferred)": {
    parentCompany: "Medico Corp",
    amBestRating: "A+",
    amBestOutlook: "Stable",
    naicPremiumsEarned: 17835029,
    naicClaimsIncurred: 16922239,
    naicLossRatio: 94.9,
    naicLivesCovered: 13454,
    naicMarketShare: 0.064,
  },
  "Medico Life and Health Insurance Company (Standard I)": {
    parentCompany: "Medico Corp",
    amBestRating: "A+",
    amBestOutlook: "Stable",
    naicPremiumsEarned: 17835029,
    naicClaimsIncurred: 16922239,
    naicLossRatio: 94.9,
    naicLivesCovered: 13454,
    naicMarketShare: 0.064,
  },
  "Medico Life and Health Insurance Company (Standard II)": {
    parentCompany: "Medico Corp",
    amBestRating: "A+",
    amBestOutlook: "Stable",
    naicPremiumsEarned: 17835029,
    naicClaimsIncurred: 16922239,
    naicLossRatio: 94.9,
    naicLivesCovered: 13454,
    naicMarketShare: 0.064,
  },
  "Physicians Life Insurance Company": {
    parentCompany: "Physicians Mutual Group",
    amBestRating: "A",
    amBestOutlook: "Stable",
    naicPremiumsEarned: 199078696,
    naicClaimsIncurred: 164080468,
    naicLossRatio: 82.4,
    naicLivesCovered: 87243,
    naicMarketShare: 0.718,
  },
  "Bankers Fidelity Assurance Company (Preferred)": {
    parentCompany: "Bankers Fidelity",
    amBestRating: "A",
    amBestOutlook: "Stable",
    naicPremiumsEarned: 40814389,
    naicClaimsIncurred: 29333952,
    naicLossRatio: 71.9,
    naicLivesCovered: 14508,
    naicMarketShare: 0.147,
  },
  "Bankers Fidelity Assurance Company (Standard)": {
    parentCompany: "Bankers Fidelity",
    amBestRating: "A",
    amBestOutlook: "Stable",
    naicPremiumsEarned: 40814389,
    naicClaimsIncurred: 29333952,
    naicLossRatio: 71.9,
    naicLivesCovered: 14508,
    naicMarketShare: 0.147,
  },
  "United American Insurance Company": {
    parentCompany: "Globe Life Inc.",
    amBestRating: "A+",
    amBestOutlook: "Stable",
  },
  "AFLAC": {
    parentCompany: "Aflac Inc.",
    amBestRating: "A+",
    amBestOutlook: "Stable",
  },
  "Transamerica Life Insurance Company (Direct)": {
    parentCompany: "Aegon N.V.",
    amBestRating: "A",
    amBestOutlook: "Stable",
    naicPremiumsEarned: 184345943,
    naicClaimsIncurred: 152735118,
    naicLossRatio: 82.9,
    naicLivesCovered: 63134,
    naicMarketShare: 0.664,
  },
  "WoodmenLife": {
    parentCompany: "WoodmenLife",
    amBestRating: "A",
    amBestOutlook: "Stable",
    naicPremiumsEarned: 8117385,
    naicClaimsIncurred: 7315681,
    naicLossRatio: 90.1,
    naicLivesCovered: 9341,
    naicMarketShare: 0.029,
  },
  "Bankers Life (Underwritten by Washington National Insurance Company)": {
    parentCompany: "CNO Financial Group",
    amBestRating: "A",
    amBestOutlook: "Stable",
  },
  "Bankers Life (Underwritten by Washington National Insurance Company) (Substandard)": {
    parentCompany: "CNO Financial Group",
    amBestRating: "A",
    amBestOutlook: "Stable",
  },
  "Nassau Life Insurance Company": {
    parentCompany: "Nassau Financial Group",
    amBestRating: "A-",
    amBestOutlook: "Stable",
  },
  "USAA Life Insurance Company": {
    parentCompany: "USAA",
    amBestRating: "A++",
    amBestOutlook: "Stable",
  },
  "HealthSpring National Health Insurance Company": {
    parentCompany: "The Cigna Group",
    amBestRating: "A",
    amBestOutlook: "Stable",
  },
  "HealthSpring National Health Insurance Company (Standard II)": {
    parentCompany: "The Cigna Group",
    amBestRating: "A",
    amBestOutlook: "Stable",
  },
  "HealthSpring National Health Insurance Company (Standard III)": {
    parentCompany: "The Cigna Group",
    amBestRating: "A",
    amBestOutlook: "Stable",
  },
  "American Benefit Life Insurance Company": {
    parentCompany: "American Benefit Life",
    amBestRating: "B++",
    amBestOutlook: "Stable",
    naicPremiumsEarned: 25425610,
    naicClaimsIncurred: 27427184,
    naicLossRatio: 107.9,
    naicLivesCovered: 19762,
    naicMarketShare: 0.092,
  },
  "Guarantee Trust Life Insurance Company": {
    parentCompany: "Guarantee Trust Life",
    amBestRating: "A-",
    amBestOutlook: "Stable",
  },
  "GPM Health and Life Insurance Company": {
    parentCompany: "GPM Life",
    amBestRating: "B++",
    amBestOutlook: "Positive",
  },
  "MedMutual Protect": {
    parentCompany: "Medical Mutual of Ohio",
    amBestRating: "A-",
    amBestOutlook: "Stable",
  },
  "Wisconsin Physicians Service Insurance Corporation": {
    parentCompany: "WPS Health Solutions",
    amBestRating: "A",
    amBestOutlook: "Stable",
    naicPremiumsEarned: 215699114,
    naicClaimsIncurred: 161767389,
    naicLossRatio: 75.0,
    naicLivesCovered: 70269,
    naicMarketShare: 0.777,
  },
  "Everence Association Inc.": {
    parentCompany: "Everence",
    amBestRating: "NR",
    amBestOutlook: "",
  },
  "Michigan Farm Bureau Health Plans": {
    parentCompany: "Michigan Farm Bureau",
    amBestRating: "NR",
    amBestOutlook: "",
  },
  "McLaren Health Plan Inc (Guaranteed Issue)": {
    parentCompany: "McLaren Health Care",
    amBestRating: "NR",
    amBestOutlook: "",
  },
  "McLaren Health Plan Inc (Tier 1)": {
    parentCompany: "McLaren Health Care",
    amBestRating: "NR",
    amBestOutlook: "",
  },
  "McLaren Health Plan Inc (Tier 2)": {
    parentCompany: "McLaren Health Care",
    amBestRating: "NR",
    amBestOutlook: "",
  },
  "McLaren Health Plan Inc (Tier 3)": {
    parentCompany: "McLaren Health Care",
    amBestRating: "NR",
    amBestOutlook: "",
  },
  "Health Alliance Plan of Michigan (Preferred)": {
    parentCompany: "Henry Ford Health",
    amBestRating: "NR",
    amBestOutlook: "",
  },
  "Health Alliance Plan of Michigan (Standard)": {
    parentCompany: "Henry Ford Health",
    amBestRating: "NR",
    amBestOutlook: "",
  },
  "Priority Health Insurance Company (Preferred)": {
    parentCompany: "Spectrum Health / Corewell",
    amBestRating: "NR",
    amBestOutlook: "",
  },
  "Priority Health Insurance Company (Tier 1)": {
    parentCompany: "Spectrum Health / Corewell",
    amBestRating: "NR",
    amBestOutlook: "",
  },
  "Priority Health Insurance Company (Tier 2)": {
    parentCompany: "Spectrum Health / Corewell",
    amBestRating: "NR",
    amBestOutlook: "",
  },
};

/**
 * Look up carrier data by name. Tries exact match first,
 * then fuzzy matching on key substrings.
 */
export function getCarrierData(carrierName: string): CarrierInfo | null {
  // Exact match
  if (CARRIER_DATA[carrierName]) {
    return CARRIER_DATA[carrierName];
  }

  // Fuzzy match: check if any key is contained in the carrier name or vice versa
  const lowerName = carrierName.toLowerCase();
  for (const [key, data] of Object.entries(CARRIER_DATA)) {
    const lowerKey = key.toLowerCase();
    if (lowerName.includes(lowerKey) || lowerKey.includes(lowerName)) {
      return data;
    }
  }

  // Try matching on parent company or key words
  const keywords = lowerName.split(/[\s\(\)\-,]+/).filter((w) => w.length > 3);
  for (const [key, data] of Object.entries(CARRIER_DATA)) {
    const lowerKey = key.toLowerCase();
    const matchCount = keywords.filter((kw) => lowerKey.includes(kw)).length;
    if (matchCount >= 2) {
      return data;
    }
  }

  return null;
}
