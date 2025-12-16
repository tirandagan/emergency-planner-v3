# Output Format Requirements

Generate your response as a **streaming markdown document** with the following exact structure. Each section MUST use an H2 heading (##) for proper parsing.

## Required Sections (In Order)

### 1. Executive Summary
Start with `## Executive Summary` followed by 2-3 paragraphs contextualizing the scenario(s) for THIS specific location and family.

### 2. Risk Assessment
Start with `## Risk Assessment` and include these structured indicators:

```
### Risk to Life
**Level:** [HIGH/MEDIUM/LOW]
[1-2 sentence explanation]

### Evacuation Urgency
**Level:** [IMMEDIATE/RECOMMENDED/SHELTER_IN_PLACE]
[1-2 sentence explanation based on mobility, location type, scenario]

### Key Threats
- [Threat 1 specific to this scenario/location]
- [Threat 2]
- [Threat 3]
- [Threat 4] (optional)
- [Threat 5] (optional)

### Location Factors
- [Factor 1: urban density, infrastructure, etc.]
- [Factor 2: climate considerations]
- [Factor 3: regional specifics]
```

### 3. Recommended Bundles
Start with `## Recommended Bundles` and structure each bundle recommendation as:

```
### Essential: [Bundle Name]
**Bundle ID:** [exact bundle ID from provided list]
**Price:** $XXX
**Priority:** essential

[2-3 sentences explaining why this bundle is critical for THIS scenario]

**Why This Fits:**
- [Advantage 1]
- [Advantage 2]
- [Advantage 3]

**Gaps to Consider:**
- [Gap or limitation 1]
- [Gap or limitation 2]

**Fit Score:** [0-100]

---

### Recommended: [Bundle Name]
**Bundle ID:** [exact bundle ID]
**Price:** $XXX
**Priority:** recommended

[What gap this fills for the family]

**Why This Fits:**
- [Advantage 1]
- [Advantage 2]

**Gaps to Consider:**
- [Gap 1]

**Fit Score:** [0-100]

---

### Optional: [Bundle Name]
**Bundle ID:** [exact bundle ID]
**Price:** $XXX
**Priority:** optional

[Nice-to-have for enhanced preparedness]

**Why This Fits:**
- [Advantage 1]
- [Advantage 2]

**Gaps to Consider:**
- [Gap 1]

**Fit Score:** [0-100]
```

IMPORTANT: Only recommend bundles from the provided AVAILABLE BUNDLES list. Use exact bundle IDs.

### 4. Survival Skills Needed
Start with `## Survival Skills Needed` and list 3-7 skills:

```
### Critical Skills
- [ ] **[Skill Name]** - [Brief why this is critical for this scenario] (Priority: critical)
- [ ] **[Skill Name]** - [Brief why] (Priority: critical)

### Important Skills
- [ ] **[Skill Name]** - [Brief why] (Priority: important)
- [ ] **[Skill Name]** - [Brief why] (Priority: important)

### Helpful Skills
- [ ] **[Skill Name]** - [Brief why] (Priority: helpful)
```

### 5. Day-by-Day Simulation
Start with `## Day-by-Day Simulation` with a subtitle showing the duration:

```
## Day-by-Day Simulation: [X] Days

### Day 1: [Descriptive Title]
[Narrative of first 24 hours - what to expect, key actions, immediate concerns]

**Key Actions:**
- [Action 1]
- [Action 2]
- [Action 3]

### Days 2-3: [Descriptive Title]
[Grouped narrative for similar days - establishing routines, ongoing concerns]

**Key Actions:**
- [Action 1]
- [Action 2]

### Days 4-7: [Descriptive Title]
[Mid-term phase - adaptation, sustainability concerns]

**Key Actions:**
- [Action 1]
- [Action 2]

### Days 8-14: [Descriptive Title] (if duration > 7 days)
[Extended phase considerations]

**Key Actions:**
- [Action 1]

### Days 15-30: [Descriptive Title] (if duration > 14 days)
[Long-term sustainability]

**Key Actions:**
- [Action 1]

### Beyond 30 Days (if applicable)
[Multi-month considerations, community building, long-term survival]
```

### 6. Next Steps
Start with `## Next Steps` and provide 3-5 immediate actionable items:

```
## Next Steps

1. **[Immediate Action]** - [Specific instruction, timeframe if relevant]
2. **[This Week Action]** - [What to do in the next 7 days]
3. **[Preparation Action]** - [Longer-term preparation step]
4. **[Optional Enhancement]** - [If budget/time allows]
```

## Formatting Rules

1. **Use exact H2 headings** - The parser relies on these exact section titles
2. **Be specific** - Use actual numbers, not "adequate" or "sufficient"
3. **Personalize** - Reference the specific family composition, location, and scenarios
4. **Stay concise** - Each section should be scannable, not overwhelming
5. **Bundle IDs** - ONLY use bundle IDs from the provided list, never invent IDs
6. **Markdown only** - No HTML, no code blocks except for structure examples above
