# Feature Parity Testing: Golden Age Quoting Tool vs Medicare.gov

## Your Role

You are a QA analyst evaluating how close our Medicare quoting application (`localhost:3000`) comes to the decision-making value that Medicare.gov provides. You will test both platforms in parallel using identical or near-identical inputs, then document findings in a structured format.

This is not a pass/fail test. This is a comparative evaluation of how well each platform helps a Medicare-eligible person confidently choose a plan. You are measuring decision support quality, not just whether a feature exists.

---

## Platforms Under Test

| Platform | URL | Description |
|----------|-----|-------------|
| **Our app** | `http://localhost:3000` | Golden Age Quoting Tool (Next.js, proxies Medicare.gov API) |
| **Benchmark** | `https://www.medicare.gov/plan-compare/` | CMS official plan finder |

---

## How Our App Works (Read This First)

Before testing, understand our app's flow so you can navigate it efficiently.

### Entry Point
- Go to `localhost:3000`
- Enter a ZIP code and select a plan type: **Medicare Advantage (MA/MAPD)** or **Part D (PDP)**
- Click through to results

### MAPD Flow (4-step wizard)
1. **Add Prescriptions** — Type a drug name (3+ chars triggers autocomplete). Select from dropdown. Configure quantity and fill frequency (30/60/90/180/360 days). Add multiple drugs. You can skip this step.
2. **Select Doctors** — Type a provider name (2+ chars). Select from dropdown showing name, credential, specialty, and location. Add multiple. You can skip.
3. **Select Pharmacies** — Mail order is offered at top. Search by address for nearby pharmacies sorted by distance. Check one or more. You can skip.
4. **Results** — Plan cards with sorting, filtering, checkboxes for comparison (max 3). Inline comparison table appears when plans are selected. "Full comparison" button opens a detailed modal.

### PDP Flow (3-step wizard)
1. **Add Prescriptions** — Same drug search as MAPD. You can skip.
2. **Select Pharmacies** — Same pharmacy picker. You can skip.
3. **Results** — Plan cards, sorting, filtering, checkboxes (max 3), inline table, "Full comparison" modal.

### Comparison Features
- **Inline table**: Quick side-by-side showing plan name, organization, premium, deductible, estimated drug cost (if drugs entered), star rating
- **Full comparison modal (MAPD)**: Overview (premiums, deductibles, MOOP), Plan Features (boolean grid with checkmarks), Benefits & Costs (copays by service category), Extra Benefits (dental/vision/hearing detail), Drug Coverage & Costs, Cost Sharing
- **Full comparison modal (PDP)**: Overview (premium, deductible, stars), Drug Coverage & Costs, Estimated Drug + Premium by pharmacy, Tiers/Gap/Pharmacy info
- Rows with differences between plans are highlighted in amber
- Print and Save as PDF available

### Sorting Options
- MAPD: Premium, Stars, Drug Cost, Health Deductible
- PDP: Premium, Deductible, Stars, Est. Total Cost

### Filter Options
- MAPD: Carriers, Star Ratings, Plan Type (HMO/PPO), Plan Features (Vision, Dental, Hearing, etc.)
- PDP: Carriers, Star Ratings

---

## How Medicare.gov Works (For Reference)

### Entry Point
- Go to `https://www.medicare.gov/plan-compare/`
- Enter ZIP, answer a few questions about Medicare eligibility
- Navigate to plan results for MAPD or PDP

### MAPD Flow
- Optional: add drugs, select pharmacies, add doctors/providers
- Search results show plan cards with premium, benefits checklist, copays, estimated costs
- Checkbox "Add to compare" on each card (max 3)
- "Compare" button in sticky bottom bar opens full comparison page

### PDP Flow
- Optional: add drugs, select pharmacies
- Search results show plan cards with premium, deductible, estimated costs
- Same compare mechanic (max 3, bottom bar, Compare button)

### Medicare.gov Comparison Page Sections (MAPD)
1. **Header**: Plan name, combined monthly premium, Enroll + Plan Details buttons
2. **Overview**: Star rating, health deductible, drug deductible, MOOP (in-network and out-of-network for PPO), health premium, drug premium, Standard Part B premium, Part B premium reduction
3. **Plan Features**: 17 boolean items (Vision, Dental, Hearing, Transportation, Fitness, Worldwide Emergency, OTC drugs, In-home support, PERS, Chiropractic, Home/bathroom safety, Part B reduction, Meals, Annual physical, Telehealth, Endodontics, Periodontics) plus "View additional benefits" link
4. **Benefits & Costs**: Primary doctor, Specialist, Diagnostic tests, Lab services, Radiology (MRI), Outpatient x-rays, Emergency care, Urgent care, Inpatient hospital (tiered per-day), Outpatient hospital, Preventive services — each showing In-network and Out-of-network for PPO
5. **Extra Benefits**: Hearing (prescription + OTC), Preventive dental (exams, x-rays, cleaning), Comprehensive dental (restorative, periodontics, oral surgery), More extras (eyeglasses, SNF, DME, diabetes supplies)
6. **Drug Coverage & Costs**: Drugs covered/not covered count, per-pharmacy estimated total with network tier labels

### Medicare.gov Comparison Page Sections (PDP)
1. **Header**: Plan name, monthly premium, Enroll + Plan Details buttons
2. **Overview**: Star rating, total monthly premium, yearly drug deductible
3. **Drug Coverage & Costs**: Drugs covered/not covered, per-pharmacy estimates (if drugs and pharmacies entered)

---

## Test ZIP Codes and FIPS

Use these for consistency across scenarios. Use whichever is most appropriate for each scenario.

| ZIP | County | FIPS | State | Notes |
|-----|--------|------|-------|-------|
| 48383 | Oakland | 26125 | MI | Primary test ZIP (our app default area) |
| 48116 | Livingston | 26093 | MI | Good plan variety, used in prior testing |
| 33101 | Miami-Dade | 12086 | FL | High MA plan density market |
| 85001 | Maricopa | 04013 | AZ | Different carrier mix |

---

## Test Medications

Use these specific drugs. They cover generic, brand, and high-cost categories.

| Drug | Type | Notes |
|------|------|-------|
| Metformin | Generic | Common, cheap, universal coverage |
| Lisinopril | Generic | Common blood pressure med |
| Atorvastatin | Generic | Statin, widely covered |
| Eliquis (apixaban) | Brand | Expensive blood thinner, coverage varies significantly |
| Jardiance (empagliflozin) | Brand | Expensive diabetes drug |
| Humira (adalimumab) | Specialty | Very high cost, often specialty tier |
| Omeprazole | Generic | Common acid reflux med |

Default quantity: 30. Default frequency: 30 days. Adjust only when a scenario calls for it.

---

## Test Providers

| Name | Type | Specialty | Notes |
|------|------|-----------|-------|
| (search "Smith") | PCP | Family Medicine / Internal Medicine | Common name, many results |
| (search "Johnson") | PCP | Internal Medicine | Backup PCP search |
| (search "Patel") | Specialist | Cardiology | Specialist test |
| (search "Lee") | Specialist | Endocrinology | Specialist test |
| (search "Williams") | Specialist | Orthopedics | Specialist test |

Use whatever results appear for the test ZIP. The point is to add providers and observe how they affect plan results and comparison.

---

## Required Scenarios

Run each scenario on BOTH platforms using the same inputs. If Medicare.gov does not support an input (e.g., a specific doctor search), note that as a finding.

---

### Scenario 1: PDP Simple

**Label:** `PDP | 1 generic med | 3-plan compare`

**Inputs:**
- Plan type: PDP
- ZIP: 48383
- Medications: Metformin (qty 30, 30 days)
- Pharmacies: Select one nearby retail pharmacy
- Plans to compare: Select 3 PDP plans

**Test on both platforms:**
1. Enter the medication
2. Select a pharmacy
3. View results
4. Select 3 plans and open comparison
5. Document everything the comparison shows

---

### Scenario 2: PDP Complex

**Label:** `PDP | 4 meds (generic + brand + high-cost) | 3-plan compare`

**Inputs:**
- Plan type: PDP
- ZIP: 48116
- Medications: Metformin, Lisinopril, Eliquis, Jardiance
- Pharmacies: Select one retail + mail order if available
- Plans to compare: Select 3 PDP plans with different premiums

**Test on both platforms:**
1. Enter all 4 medications
2. Select pharmacies
3. View results — note how estimated costs change with the expensive drugs
4. Select 3 plans and open comparison
5. Document whether comparison makes clear which plan is cheapest for these specific drugs

---

### Scenario 3: MAPD Simple

**Label:** `MAPD | 1 med | 1 PCP | 3-plan compare`

**Inputs:**
- Plan type: MAPD
- ZIP: 48383
- Medications: Atorvastatin (qty 30, 30 days)
- Doctors: Search "Smith", select one Family Medicine PCP
- Pharmacies: Select one nearby pharmacy
- Plans to compare: Select 3 MAPD plans (try to include both HMO and PPO if available)

**Test on both platforms:**
1. Enter medication
2. Add doctor
3. Select pharmacy
4. View results
5. Select 3 plans (ideally mix HMO + PPO) and open comparison
6. Document how doctor/network information appears in comparison

---

### Scenario 4: MAPD Multi-Doctor

**Label:** `MAPD | 3 meds | 1 PCP + 2 specialists | 3-plan compare`

**Inputs:**
- Plan type: MAPD
- ZIP: 48116
- Medications: Metformin, Eliquis, Omeprazole
- Doctors: 1 PCP (search "Johnson"), 1 Cardiologist (search "Patel"), 1 Endocrinologist (search "Lee")
- Pharmacies: Select one nearby + mail order
- Plans to compare: Select 3 MAPD plans

**Test on both platforms:**
1. Enter all medications
2. Add all 3 doctors
3. Select pharmacies
4. View results
5. Compare 3 plans
6. Evaluate: Does comparison show whether each doctor is in-network for each plan?

---

### Scenario 5: MAPD Network Sensitivity

**Label:** `MAPD | network differences | 3-plan compare`

**Inputs:**
- Plan type: MAPD
- ZIP: 33101 (Miami — high plan density, more network variation)
- Medications: Lisinopril
- Doctors: Add 3 different providers (PCP + 2 specialists)
- Plans to compare: Deliberately pick one HMO and two PPOs (or vice versa) where network rules differ

**Test on both platforms:**
1. Add providers
2. Select plans with different network types
3. Open comparison
4. Evaluate: Does the compare view clearly indicate which plans your doctors are in-network for? Does it show cost differences for in-network vs out-of-network visits?

---

### Scenario 6: Pharmacy Sensitivity

**Label:** `PDP | same meds | different pharmacies | compare`

**Inputs:**
- Plan type: PDP
- ZIP: 48383
- Medications: Metformin, Eliquis
- Run this scenario twice:
  - **Run A**: Select only a retail pharmacy nearby
  - **Run B**: Select only mail order pharmacy
- Plans to compare: Same 3 plans in both runs

**Test on both platforms:**
1. Run A: retail pharmacy only → compare 3 plans → record costs
2. Run B: mail order only → compare 3 plans → record costs
3. Document: Do the estimated costs change between runs? Is it obvious which pharmacy option saves money? Does the comparison surface pharmacy-specific pricing?

---

### Scenario 7: Similar-Plan Tradeoff Test

**Label:** `MAPD | similar premiums | different value | 3-plan compare`

**Inputs:**
- Plan type: MAPD
- ZIP: 48116
- Medications: Atorvastatin, Eliquis
- Doctors: 1 PCP
- Pharmacies: Select one nearby
- Plans to compare: Deliberately choose 3 plans with similar monthly premiums (e.g., all $0 or all within $10 of each other) but different deductibles, MOOP, benefits, or star ratings

**Test on both platforms:**
1. Find 3 plans with similar premiums
2. Open comparison
3. Evaluate: When premiums are nearly identical, does the comparison tool make it easy to see which plan provides better overall value? Are deductible, MOOP, benefit, and drug cost differences visually prominent?

---

## What to Look For in Every Comparison View

For each scenario, check whether the comparison view on each platform clearly shows the following. Mark each as: **Shown**, **Partially shown**, **Not shown**, or **N/A**.

### Overview / Cost Data
- [ ] Monthly premium (Part C for MAPD, Part D for PDP)
- [ ] Drug premium (separate from health premium for MAPD)
- [ ] Combined premium
- [ ] Health deductible (MAPD)
- [ ] Drug deductible
- [ ] Maximum out-of-pocket / MOOP (MAPD)
- [ ] MOOP out-of-network (PPO plans)
- [ ] Standard Part B premium reference
- [ ] Part B premium reduction
- [ ] Estimated annual drug cost
- [ ] Estimated total yearly cost (drugs + premiums)
- [ ] Per-pharmacy cost breakdown

### Plan Quality / Identity
- [ ] Plan name
- [ ] Organization / carrier name
- [ ] Plan ID
- [ ] Plan type (HMO, PPO, PDP)
- [ ] Star rating (visual stars, not just number)
- [ ] High/low performing indicator

### Plan Features (MAPD only)
- [ ] Vision
- [ ] Dental
- [ ] Hearing
- [ ] Transportation
- [ ] Fitness / SilverSneakers
- [ ] Telehealth
- [ ] OTC drug benefits
- [ ] Worldwide emergency
- [ ] In-home support
- [ ] PERS
- [ ] Chiropractic
- [ ] Home/bathroom safety devices
- [ ] Meals
- [ ] Annual physical exams
- [ ] Endodontics
- [ ] Periodontics

### Benefits & Costs (MAPD only)
- [ ] Primary care visit copay
- [ ] Specialist visit copay
- [ ] Diagnostic tests
- [ ] Lab services
- [ ] Radiology / MRI
- [ ] Outpatient x-rays
- [ ] Emergency care
- [ ] Urgent care
- [ ] Inpatient hospital (tiered display)
- [ ] Outpatient hospital
- [ ] Preventive services
- [ ] In-network vs out-of-network shown for PPO

### Extra Benefits (MAPD only)
- [ ] Hearing aids (prescription + OTC)
- [ ] Preventive dental (exams, x-rays, cleaning)
- [ ] Comprehensive dental (restorative, perio, surgery)
- [ ] Eyeglasses / vision detail
- [ ] Skilled nursing facility
- [ ] DME
- [ ] Diabetes supplies

### Drug Coverage
- [ ] Drug coverage status (covered / not covered per drug)
- [ ] Pharmacy-specific pricing
- [ ] Mail order pricing
- [ ] Network tier per pharmacy (preferred, in-network, out-of-network)
- [ ] Drug tier information (generic, preferred brand, specialty)

### Doctor / Network (MAPD only)
- [ ] Doctor in-network indicator per plan
- [ ] Specialist in-network indicator per plan
- [ ] Referral requirements noted
- [ ] Network type clearly labeled

### UX / Decision Support
- [ ] Differences between plans visually highlighted
- [ ] Print / PDF export available
- [ ] Link to full plan details
- [ ] Enroll action available
- [ ] Clear section headings
- [ ] Easy to scan horizontally across plans
- [ ] Mobile-friendly / responsive

---

## Required Output Format

For each of the 7 scenarios, produce the following structured report:

```
## Scenario [N]: [Label]

### Inputs
- Plan type: [PDP or MAPD]
- ZIP / County: [value]
- Medications: [list with qty/frequency]
- Doctors: [list with specialty — or N/A for PDP]
- Pharmacies: [description]
- Plans selected: [3 plan names or descriptions]

### Results: localhost:3000

#### Quoting Flow
[Describe what happened step by step. Note any issues, delays, or UX observations.]

#### Compare View
[Describe what the comparison shows. Reference the checklist above — which items are shown, which are missing.]

#### Strengths
- [bullet list]

#### Weaknesses
- [bullet list]

#### Missing Elements
- [bullet list of things Medicare.gov shows that our tool does not]

---

### Results: Medicare.gov

#### Quoting Flow
[Same structure]

#### Compare View
[Same structure]

#### Strengths
- [bullet list]

#### Weaknesses
- [bullet list]

#### Missing Elements
- [bullet list of things our tool shows that Medicare.gov does not]

---

### Direct Comparison

#### Medicare.gov does better:
- [bullet list]

#### localhost:3000 does better:
- [bullet list]

#### Parity assessment:
[1-2 sentence summary of how close we are]

#### Key gaps:
- [bullet list of the most impactful missing features]

#### Recommended improvements:
- [bullet list prioritized by impact]

---

### Scores (1-5 scale, 5 = excellent)

| Dimension | localhost:3000 | Medicare.gov |
|-----------|---------------|-------------|
| Data completeness | | |
| Compare clarity | | |
| Doctor usefulness | | |
| Medication usefulness | | |
| Pharmacy usefulness | | |
| Trust / confidence | | |
| Speed to decision | | |
| Overall decision support | | |

**Overall parity score:** [X/100 — our app's score as percentage of Medicare.gov's score]
**Gap severity:** [Critical / High / Medium / Low]
```

---

## Final Summary Section

After all 7 scenarios, produce a summary section:

```
## Overall Findings

### Aggregate Scores

| Dimension | localhost:3000 (avg) | Medicare.gov (avg) | Gap |
|-----------|---------------------|-------------------|-----|
| Data completeness | | | |
| Compare clarity | | | |
| Doctor usefulness | | | |
| Medication usefulness | | | |
| Pharmacy usefulness | | | |
| Trust / confidence | | | |
| Speed to decision | | | |
| Overall decision support | | | |

### Overall Parity Score: [X/100]

### Top 5 Critical Gaps (ranked by impact on user decision-making)
1. [gap]
2. [gap]
3. [gap]
4. [gap]
5. [gap]

### Top 5 Strengths of Our Tool vs Medicare.gov
1. [strength]
2. [strength]
3. [strength]
4. [strength]
5. [strength]

### Recommended Implementation Priority
1. [highest impact improvement]
2. [next]
3. [next]
4. [next]
5. [next]

### Can a broker confidently present our comparison tool to a client today?
[Yes / No / With caveats — explain in 2-3 sentences]
```

---

## Important Notes

- Test BOTH platforms for every scenario. Do not skip Medicare.gov even if it takes longer.
- Use the same ZIP, drugs, and doctors on both platforms for each scenario.
- If Medicare.gov requires additional steps our app does not (eligibility questions, etc.), complete them and note the difference.
- If our app has a feature Medicare.gov does not, note it as a strength.
- If a comparison field is technically present but poorly formatted or hard to read, mark it "Partially shown" and explain.
- If plan detail data comes back empty or with placeholder text, note it — this may indicate an API parsing issue rather than a missing feature.
- For pharmacy scenarios, pay attention to whether costs actually change — this tests whether the pharmacy selection is meaningfully integrated into results.
- When scoring, a 3 means "adequate — gets the job done." A 5 means "as good or better than what a broker would expect from a professional tool." A 1 means "missing or so broken it provides no value."
