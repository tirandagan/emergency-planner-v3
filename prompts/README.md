# Prompt Management System

## Overview

This directory contains all AI prompts used throughout the Emergency Planner application. Prompts are organized by feature area and stored as markdown files for easy editing and version control.

## Benefits

- 📝 **Non-technical editing** - Marketing/product team can update prompts without code changes
- 🔍 **Version control** - Git tracks all prompt changes with full history
- 🧪 **A/B testing** - Easy to create variants and compare performance
- 🎯 **Consistency** - Shared prompts ensure consistent voice and quality
- 🚀 **Fast iteration** - Update prompts without code deployment

## Folder Structure

```
prompts/
├── README.md                           # This file
│
├── mission-generation/                 # AI survival plan generation
│   ├── system-prompt.md
│   ├── scenarios/                      # Scenario-specific guidance
│   ├── supply-calculation.md
│   ├── evacuation-routing.md
│   └── simulation-log-generation.md
│
├── bundle-recommendations/             # AI bundle matching
│   ├── system-prompt.md
│   ├── scenario-matching.md
│   ├── family-size-optimization.md
│   └── customization-suggestions.md
│
├── readiness-assessment/               # Readiness scoring
│   ├── system-prompt.md
│   ├── scoring-algorithm.md
│   └── gap-analysis.md
│
├── skills-resources/                   # Skills curation
│   ├── system-prompt.md
│   └── resource-curation.md
│
├── email-personalization/              # Email generation
│   ├── system-prompt.md
│   ├── newsletter-generation.md
│   └── bundle-recommendations.md
│
├── admin-analytics/                    # Admin insights
│   ├── user-insights.md
│   └── bundle-performance-analysis.md
│
└── shared/                             # Shared guidance
    ├── tone-and-voice.md
    └── safety-disclaimers.md
```

## Naming Conventions

### Folders
- Use `kebab-case` for all folder names
- Name folders after feature areas or domains
- Keep folder names short but descriptive

### Files
- Use `kebab-case.md` for all prompt files
- Always include `system-prompt.md` in each feature folder (context for AI)
- Name task-specific prompts after their purpose: `gap-analysis.md`, `scenario-matching.md`
- Use descriptive names that indicate what the prompt does

### Examples
✅ **Good:**
- `mission-generation/system-prompt.md`
- `bundle-recommendations/scenario-matching.md`
- `email-personalization/newsletter-generation.md`

❌ **Bad:**
- `missionGeneration/systemPrompt.md` (wrong case)
- `prompts/prompt1.md` (not descriptive)
- `bundle_recommendations/scenario_matching.md` (underscores instead of hyphens)

## Writing Effective Prompts

### System Prompts
System prompts provide context and role definition for the AI. They should:
- Define the AI's role and expertise
- Establish tone and voice guidelines
- Set output format expectations
- Include relevant domain knowledge

### Task Prompts
Task prompts guide specific operations. They should:
- Be clear and specific about desired output
- Include examples when helpful
- Define constraints and requirements
- Use placeholder variables: `{{variable_name}}`

### Prompt Template Variables

Use double curly braces for variables that will be replaced at runtime:

```markdown
Hello {{user_name}},

Your family of {{family_size}} people needs the following supplies...
```

Common variables:
- `{{user_name}}` - User's full name
- `{{family_size}}` - Number of people
- `{{location}}` - City/state
- `{{scenarios}}` - Selected disaster scenarios
- `{{duration}}` - Plan duration in days

## Usage Examples

### Loading Prompts in Code

```typescript
import { loadPrompt, loadPromptWithVariables } from '@/lib/prompts/loader';

// Load static prompt
const systemPrompt = await loadPrompt('mission-generation/system-prompt.md');

// Load prompt with variable replacement
const personalizedPrompt = await loadPromptWithVariables(
  'email-personalization/newsletter-generation.md',
  {
    user_name: 'John Doe',
    user_tier: 'PRO'
  }
);
```

### Using with Vercel AI SDK

```typescript
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { loadPrompt } from '@/lib/prompts/loader';

const systemPrompt = await loadPrompt('mission-generation/system-prompt.md');
const taskPrompt = await loadPrompt('mission-generation/supply-calculation.md');

const { text } = await generateText({
  model: google('gemini-2.0-flash-exp'),
  system: systemPrompt,
  prompt: taskPrompt,
  temperature: 0.7
});
```

## Prompt Optimization Tips

1. **Be Specific** - Clear instructions produce better outputs
2. **Use Examples** - Show the AI what good output looks like
3. **Set Constraints** - Define limits (length, format, tone)
4. **Iterate** - Test prompts and refine based on results
5. **Version Control** - Commit changes with descriptive messages
6. **A/B Test** - Create variants to compare performance

## Prompt Quality Checklist

Before committing a new or updated prompt, verify:

- [ ] Prompt has a clear, specific task
- [ ] Role/context is defined (for system prompts)
- [ ] Output format is specified
- [ ] Variables are properly marked: `{{variable}}`
- [ ] Tone matches brand voice guidelines
- [ ] No sensitive data or API keys included
- [ ] Examples provided (if complex task)
- [ ] Tested with real inputs
- [ ] Git commit message describes the change

## Brand Voice Guidelines

All prompts should align with Emergency Planner's voice:

- **Tone:** Expert but approachable, reassuring not alarmist
- **Language:** Clear and direct, avoid jargon
- **Attitude:** Empowering users to take control of their safety
- **Safety:** Always include appropriate disclaimers for critical advice

See `shared/tone-and-voice.md` for detailed guidelines.

## Maintenance

### Updating Prompts
1. Edit the markdown file directly
2. Test changes with representative inputs
3. Commit with descriptive message: `git commit -m "Improve bundle matching prompt for large families"`
4. Deploy (prompts are read from filesystem, no rebuild needed in dev)

### Versioning Strategy
- Use Git tags for major prompt versions: `v1.0.0-mission-gen`
- Document breaking changes in commit messages
- Keep deprecated prompts for 1 release cycle before removing

### Performance Monitoring
Track prompt performance metrics:
- Response quality (user feedback)
- Token usage (cost efficiency)
- Response time (speed)
- Error rates (reliability)

## Security Guidelines

### ⚠️ Never Include in Prompts:
- API keys or secrets
- User passwords or PII
- Production database credentials
- Internal system architecture details

### ✅ Safe to Include:
- Public product information
- Brand voice guidelines
- General domain knowledge
- Example outputs (anonymized)

## Getting Help

- **Questions:** Ask in #engineering Slack channel
- **Prompt ideas:** Discuss in #product channel
- **Issues:** Create GitHub issue with `prompt-system` label
- **Emergency:** Tag @engineering-lead for critical prompt issues

---

**Last Updated:** 2025-01-09  
**Maintainer:** Engineering Team

