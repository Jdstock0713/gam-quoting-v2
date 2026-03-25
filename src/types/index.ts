/* ------------------------------------------------------------------ */
/*  Plan Type Selection                                               */
/* ------------------------------------------------------------------ */

export type PlanType = "medigap" | "ma" | "pdp";

/* ------------------------------------------------------------------ */
/*  Product Line (top-level toggle)                                    */
/* ------------------------------------------------------------------ */

export type ProductLine = "medicare" | "life";

/* ------------------------------------------------------------------ */
/*  Geography                                                         */
/* ------------------------------------------------------------------ */

export type County = {
  name: string;
  fips: string;
  state: string;
};

/* ------------------------------------------------------------------ */
/*  Medigap (existing, unchanged)                                     */
/* ------------------------------------------------------------------ */

export type QuoteRequest = {
  zip: string;
  age: number;
  gender: "male" | "female";
  tobacco: boolean;
  plan: string;
};

export type Quote = {
  id: string;
  carrier: string;
  plan: string;
  premium: number;
  premiumMax: number;
  rateType: string;
  phone: string;
  website: string;
};

export type MedigapPolicy = {
  company: string;
  rate_type: string;
  monthly_rate_min: number;
  monthly_rate_max: number;
  address: string;
  phone_number: string;
  website: string;
  monthly_rate_hhd_standard_min: number | null;
  monthly_rate_hhd_standard_max: number | null;
  monthly_rate_hhd_roommate_min: number | null;
  monthly_rate_hhd_roommate_max: number | null;
};

/* ------------------------------------------------------------------ */
/*  Medicare Advantage (MA / MAPD)                                    */
/* ------------------------------------------------------------------ */

export type MASearchRequest = {
  zip: string;
  fips: string;
  year?: string;
  page?: number;
};

export type MAPlan = {
  id: number;
  name: string;
  url: string;
  contract_year: string;
  contract_id: string;
  plan_id: string;
  segment_id: string;
  plan_type: string;           // PLAN_TYPE_MAPD | PLAN_TYPE_MA
  category: string;            // PLAN_CATEGORY_LOCAL_PPO, _HMO, etc.
  organization_name: string;
  annual_deductible: string;
  drug_plan_deductible: number;
  partb_premium_reduction: number;
  partc_premium: number;
  partd_premium: number;
  annual_drugs_total: number;
  maximum_oopc: string;
  silver_sneakers: boolean;
  transportation: boolean;
  telehealth: boolean;
  otc_drugs: boolean;
  snp_type: string;
  overall_star_rating: {
    category: string;
    rating: number;
    error: string;
  };
  low_performing: boolean;
  high_performing: boolean;
  calculated_monthly_premium: number;
  total_remaining_premium: number;
  remaining_premium_and_drugs: number;
  package_services: {
    doctor_choice: string;
    outpatient_prescription: string;
    dental_services: string;
    vision_services: string;
    hearing_services: string;
    ms_hearing_services: boolean;
    ms_dental_services: boolean;
    ms_vision_services: boolean;
  } | null;
  primary_doctor_cost_sharing: {
    network_status: string;
    min_copay: number;
    max_copay: number;
    min_coinsurance: number | null;
    max_coinsurance: number | null;
  } | null;
  specialist_doctor_cost_sharing: {
    network_status: string;
    min_copay: number;
    max_copay: number;
    min_coinsurance: number | null;
    max_coinsurance: number | null;
  } | null;
  enrollment_opt_in_status: boolean;
};

/**
 * Raw JSON from Medicare.gov GET /plan/{year}/{contract_id}/{plan_id}/{segment_id}.
 * Shape varies by plan type and year — treat as open object; UI parses defensively.
 */
export type MAPlanDetail = Record<string, unknown>;

/* ------------------------------------------------------------------ */
/*  Part D (Prescription Drug Plans)                                  */
/* ------------------------------------------------------------------ */

export type PDPSearchRequest = {
  zip: string;
  fips: string;
  year?: string;
  page?: number;
};

export type PDPPlan = {
  id: number;
  name: string;
  url: string;
  contract_year: string;
  contract_id: string;
  plan_id: string;
  segment_id: string;
  plan_type: string;           // PLAN_TYPE_PDP
  category: string;            // PLAN_CATEGORY_MEDICARE_PDP
  organization_name: string;
  drug_plan_deductible: number;
  partd_premium: number;
  annual_drugs_total: number;
  overall_star_rating: {
    category: string;
    rating: number;
    error: string;
  };
  low_performing: boolean;
  high_performing: boolean;
  calculated_monthly_premium: number;
  remaining_premium_and_drugs: number;
  enrollment_opt_in_status: boolean;
};

/** PDP plan detail from Medicare.gov GET /plan/{year}/{contract_id}/{plan_id}/{segment_id}. */
export type PDPPlanDetail = Record<string, unknown>;

/* ------------------------------------------------------------------ */
/*  Per-pharmacy drug cost row (from search API)                      */
/* ------------------------------------------------------------------ */

export type PharmacyCostRow = {
  pharmacyName: string;
  networkTier: "Preferred" | "Standard" | "Non-preferred" | string;
  estimatedAnnualCost: number;
};

/* ------------------------------------------------------------------ */
/*  Drug coverage status per entered drug                             */
/* ------------------------------------------------------------------ */

export type DrugCoverageRow = {
  drugName: string;
  covered: boolean;
  tier?: string;
  restrictions?: string;
};

/* ------------------------------------------------------------------ */
/*  Drug Lookup                                                       */
/* ------------------------------------------------------------------ */

export type Drug = {
  rxcui: string;
  name: string;
  is_generic: boolean;
  insulin: boolean;
  generic: { rxcui: string; name: string; branded_generic: boolean } | null;
  generics: { rxcui: string; name: string; branded_generic: boolean }[];
};

/* ------------------------------------------------------------------ */
/*  Pharmacy Lookup                                                   */
/* ------------------------------------------------------------------ */

export type Pharmacy = {
  name: string;
  street: string;
  city: string;
  state: string;
  zipcode: string;
  npi: string;
  phone: string;
  distance_miles: number;
};

/* ------------------------------------------------------------------ */
/*  Provider / Physician Lookup  (via NPPES NPI Registry)             */
/* ------------------------------------------------------------------ */

export type Provider = {
  npi: string;
  first_name: string;
  last_name: string;
  credential: string;
  specialty: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
};

/* ------------------------------------------------------------------ */
/*  Life Insurance (Compulife API)                                     */
/* ------------------------------------------------------------------ */

export type LifeQuoteRequest = {
  state: string;          // numeric state code (1-56)
  birthMonth: string;
  birthDay: string;
  birthYear: string;
  gender: "M" | "F";
  smoker: "Y" | "N";
  health: string;         // PP, P, RP, R, T1-T16
  category: string;       // product type code (1-9, A-H, etc.)
  faceAmount: string;     // coverage amount
  mode: string;           // M, Q, H, ALL
  isFinalExpense?: boolean; // true when quoting final expense categories
  compInc?: string;       // comma-separated Compulife company codes to include (admin filter)
};

export type LifeIssueType = "gi" | "si" | "underwritten" | "unknown";

export type LifeQuoteResult = {
  company: string;
  product: string;
  compProdCode: string;
  amBest: string;
  amBestId: string;
  premiumAnnual: string;
  premiumMonthly: string | null;
  premiumQuarterly: string | null;
  premiumSemiAnnual: string | null;
  healthClass: string;
  issueType: LifeIssueType;
  categoryTitle?: string;  // e.g. "To Age 121 Level - 20 Pay"
};

export type LifeComparisonResponse = {
  title: string;
  results: LifeQuoteResult[];
};

export type LifeCompany = {
  compCode: string;
  name: string;
};
