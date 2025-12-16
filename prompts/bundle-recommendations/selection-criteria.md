# Bundle Selection Criteria

When selecting bundles from the AVAILABLE BUNDLES list, apply these criteria in order.

## Selection Process

### Step 1: Primary Filtering (Already Done Server-Side)
The bundles you receive have already been pre-filtered for:
- Scenario tag overlap with user's selected scenarios
- Family size within bundle's min/max people range
- Budget tier alignment (when specified)

### Step 2: Rank by Scenario Match Quality
For each candidate bundle, score scenario alignment:
- **Full Match (100%)**: Bundle scenarios contain ALL user-selected scenarios
- **Strong Match (75%)**: Bundle scenarios contain MOST (>50%) user-selected scenarios
- **Partial Match (50%)**: Bundle scenarios contain SOME user-selected scenarios
- **Weak Match (25%)**: Bundle scenarios contain only ONE user-selected scenario

### Step 3: Prioritize by User's Scenario Order
The first scenario in the user's list is their PRIMARY concern. Weight matches accordingly:
- Primary scenario match: +30 points
- Secondary scenario match: +20 points
- Tertiary+ scenario match: +10 points

### Step 4: Select 3-4 Bundles with Diverse Priorities

**Essential Bundle (Required - Choose 1)**
Must-have for basic survival. Select the bundle that:
- Covers the most critical needs (water, food, first aid)
- Best matches the PRIMARY scenario
- Fits within stated budget
- Has appropriate people range

**Recommended Bundle(s) (Choose 1-2)**
Fill gaps left by the Essential bundle. Consider:
- Scenario-specific supplements (Faraday bags for EMP, PPE for pandemic)
- Extended duration supplies (if planning > 7 days)
- Medical/specialty needs based on family composition
- Avoid redundancy with Essential bundle

**Optional Bundle (Choose 0-1)**
Nice-to-have enhancements. Consider:
- Comfort items for morale
- Specialized tools for their location (urban vs rural)
- Premium upgrades if budget allows
- Skills/training materials

## Fit Score Calculation

Calculate a 0-100 fit score for each recommended bundle:

```
Base Score: 50 points

Scenario Alignment (up to +30):
  +10 per matching scenario (max +30)
  -5 for each user scenario NOT covered

Family Size Fit (up to +10):
  +10 if exact family size match
  +5 if within range but not exact
  -5 if requires quantity adjustment

Budget Alignment (up to +10):
  +10 if within stated budget tier
  +5 if slightly over but justified
  -10 if significantly over budget

Duration Appropriateness (up to +10):
  +10 if duration matches user's planning horizon
  +5 if shorter (can supplement)
  -5 if designed for much longer duration

Special Needs Coverage (+5 per match):
  +5 for medical needs coverage
  +5 for children-specific items
  +5 for elderly accommodations
  +5 for pet supplies (if pets mentioned)
```

## Pros and Cons Guidelines

### Generating Pros (2-3 per bundle)
Focus on:
- Specific scenario advantages ("Includes Faraday bags essential for EMP protection")
- Family-specific benefits ("Child-friendly food options included")
- Value propositions ("Complete water solution for 7+ days")
- Quality indicators ("Professional-grade first aid supplies")

### Generating Cons (1-2 per bundle)
Be honest about:
- Gaps in coverage ("Does not include communication equipment")
- Size limitations ("May need to double quantities for family of 6")
- Price considerations ("Premium pricing, but justified by quality")
- Missing scenario coverage ("Better suited for natural disaster than pandemic")

## Reasoning Guidelines

The reasoning for each bundle should:
1. **Open with context**: "For a family of 4 preparing for natural disaster in coastal Texas..."
2. **Connect to their situation**: "This bundle addresses your primary concern of..."
3. **Be specific**: Reference actual bundle contents, not generic statements
4. **Acknowledge trade-offs**: "While this bundle excels at X, you may want to supplement with..."

## Bundle ID Usage

CRITICAL: Only use bundle IDs from the provided AVAILABLE BUNDLES list.

- Copy the exact bundle ID as provided
- Never generate or guess bundle IDs
- If no suitable bundle exists for a category, acknowledge the gap and suggest alternatives
- If fewer than 3 suitable bundles exist, recommend fewer (quality over quantity)

## Handling Edge Cases

### No Suitable Bundles
If pre-filtered list has no good matches:
- Acknowledge the gap clearly
- Suggest the closest available option with caveats
- Recommend supplementing with individual items

### Budget Mismatch
If all suitable bundles exceed budget:
- Show the most affordable option as Essential
- Note the budget stretch with clear value justification
- Suggest a phased approach (Phase 1: Essential only)

### Multiple Scenarios with No Overlap
If user selected disparate scenarios (e.g., pandemic + nuclear):
- Prioritize based on scenario order
- Recommend scenario-specific supplementary bundles
- Note that comprehensive coverage requires multiple bundles

### Large Family (>6 people)
If family exceeds bundle max_people:
- Recommend bundles designed for largest groups
- Calculate multiplier needed ("Consider 2x this bundle")
- Note per-person cost efficiency
