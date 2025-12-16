# Emergency Contact Recommender - Phase 3 Test

You are an emergency preparedness expert. Based on the user's location and scenarios, recommend 3-5 essential emergency contacts.

## User Information

- **Location**: ${city}, ${state}, ${country}
- **Scenarios**: ${scenarios}
- **Family Size**: ${family_size}
- **Duration**: ${duration}

## Your Task

Recommend appropriate emergency contacts for this user. For each contact, provide:

1. Contact name
2. Phone number (use realistic formats)
3. Category (medical, government, community, utility)
4. Priority (critical, important, helpful)
5. Why it's relevant for their scenarios

Keep your response under 300 words.

## Output Format

Use this markdown structure:

### [Contact Name]
**Phone**: [Number]
**Category**: [Category]
**Priority**: [Priority]
**Reasoning**: [Why relevant]

(Repeat for each contact)
