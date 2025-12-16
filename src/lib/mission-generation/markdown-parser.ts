/**
 * Markdown Parser for Mission Reports
 * Extracts structured sections from streamed markdown content
 */

import type {
  ReportSections,
  RiskIndicators,
  BundleRecommendation,
  SkillItem,
  SimulationDay,
  RiskLevel,
  EvacuationUrgency,
  BundlePriority,
  SkillPriority,
} from '@/types/mission-report';

/**
 * Parse complete markdown content into structured sections
 */
export function parseReportContent(content: string): ReportSections {
  return {
    executiveSummary: extractExecutiveSummary(content),
    riskAssessment: extractRiskAssessment(content),
    bundles: extractBundleRecommendations(content),
    skills: extractSkills(content),
    simulation: extractSimulation(content),
    nextSteps: extractNextSteps(content),
  };
}

/**
 * Extract content between two H2 headings
 */
function extractSection(content: string, sectionName: string): string {
  // Create regex to find section heading
  const headingPattern = new RegExp(
    `##\\s*${sectionName}[^\\n]*\\n([\\s\\S]*?)(?=\\n##\\s|$)`,
    'i'
  );
  const match = content.match(headingPattern);
  return match ? match[1].trim() : '';
}

/**
 * Extract Executive Summary section
 */
function extractExecutiveSummary(content: string): string {
  return extractSection(content, 'Executive Summary');
}

/**
 * Extract Risk Assessment section and parse into structured data
 */
function extractRiskAssessment(content: string): RiskIndicators {
  const section = extractSection(content, 'Risk Assessment');

  // Default values
  const result: RiskIndicators = {
    riskToLife: 'MEDIUM',
    riskToLifeReason: '',
    evacuationUrgency: 'SHELTER_IN_PLACE',
    evacuationReason: '',
    keyThreats: [],
    locationFactors: [],
  };

  if (!section) return result;

  // Extract Risk to Life
  const riskToLifeMatch = section.match(
    /###?\s*Risk to Life[\s\S]*?\*\*Level:\*\*\s*(HIGH|MEDIUM|LOW)/i
  );
  if (riskToLifeMatch) {
    result.riskToLife = riskToLifeMatch[1].toUpperCase() as RiskLevel;
  }

  // Extract Risk to Life reason (text after level until next heading or section)
  const riskReasonMatch = section.match(
    /###?\s*Risk to Life[\s\S]*?\*\*Level:\*\*\s*(?:HIGH|MEDIUM|LOW)\s*\n([^\n#]+)/i
  );
  if (riskReasonMatch) {
    result.riskToLifeReason = riskReasonMatch[1].trim();
  }

  // Extract Evacuation Urgency
  const evacuationMatch = section.match(
    /###?\s*Evacuation Urgency[\s\S]*?\*\*Level:\*\*\s*(IMMEDIATE|RECOMMENDED|SHELTER[_\s]IN[_\s]PLACE)/i
  );
  if (evacuationMatch) {
    result.evacuationUrgency = evacuationMatch[1]
      .toUpperCase()
      .replace(/\s/g, '_') as EvacuationUrgency;
  }

  // Extract Evacuation reason
  const evacReasonMatch = section.match(
    /###?\s*Evacuation Urgency[\s\S]*?\*\*Level:\*\*\s*(?:IMMEDIATE|RECOMMENDED|SHELTER[_\s]IN[_\s]PLACE)\s*\n([^\n#]+)/i
  );
  if (evacReasonMatch) {
    result.evacuationReason = evacReasonMatch[1].trim();
  }

  // Extract Key Threats (bullet list)
  const threatsSection = section.match(
    /###?\s*Key Threats[^\n]*\n([\s\S]*?)(?=###|##|$)/i
  );
  if (threatsSection) {
    const threats = threatsSection[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(Boolean);
    result.keyThreats = threats.slice(0, 5);
  }

  // Extract Location Factors (bullet list)
  const locationSection = section.match(
    /###?\s*Location Factors[^\n]*\n([\s\S]*?)(?=###|##|$)/i
  );
  if (locationSection) {
    const factors = locationSection[1]
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(Boolean);
    result.locationFactors = factors.slice(0, 4);
  }

  return result;
}

/**
 * Extract Bundle Recommendations and parse into structured data
 */
function extractBundleRecommendations(content: string): BundleRecommendation[] {
  const section = extractSection(content, 'Recommended Bundles');
  if (!section) return [];

  const bundles: BundleRecommendation[] = [];

  // Split by H3 headings (each bundle)
  const bundleBlocks = section.split(/###\s+/);

  for (const block of bundleBlocks) {
    if (!block.trim()) continue;

    // Extract priority from heading (Essential, Recommended, Optional)
    const priorityMatch = block.match(/^(Essential|Recommended|Optional):/i);
    const priority: BundlePriority = priorityMatch
      ? (priorityMatch[1].toLowerCase() as BundlePriority)
      : 'recommended';

    // Extract bundle name from heading
    const nameMatch = block.match(/^(?:Essential|Recommended|Optional):\s*(.+?)(?:\n|$)/i);
    const bundleName = nameMatch ? nameMatch[1].trim() : '';

    // Extract Bundle ID
    const idMatch = block.match(/\*\*Bundle ID:\*\*\s*([a-f0-9-]+)/i);
    const bundleId = idMatch ? idMatch[1].trim() : '';

    if (!bundleId) continue; // Skip if no valid ID

    // Extract price
    const priceMatch = block.match(/\*\*Price:\*\*\s*\$?([\d,.]+)/i);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;

    // Extract fit score
    const scoreMatch = block.match(/\*\*Fit Score:\*\*\s*(\d+)/i);
    const fitScore = scoreMatch ? parseInt(scoreMatch[1], 10) : 75;

    // Extract reasoning - look for text after Priority but before next bold section
    let reasoning = '';
    const reasoningMatch = block.match(
      /\*\*Priority:\*\*\s*\w+\s*\n\n([^\n*#]+)/i
    );
    if (reasoningMatch) {
      reasoning = reasoningMatch[1].trim();
    } else {
      // Fallback: try getting paragraph after bundle name
      const altReasoningMatch = block.match(
        /^(?:Essential|Recommended|Optional):[^\n]+\n[^\n]+\n[^\n]+\n[^\n]+\n\n([^\n*#]+)/i
      );
      if (altReasoningMatch) {
        reasoning = altReasoningMatch[1].trim();
      }
    }

    // Extract pros (Why This Fits section)
    const prosSection = block.match(
      /\*\*Why This Fits:\*\*\s*\n([\s\S]*?)(?=\*\*|###|$)/i
    );
    const pros = prosSection
      ? prosSection[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.replace(/^-\s*/, '').trim())
          .filter(Boolean)
      : [];

    // Extract cons (Gaps to Consider section)
    const consSection = block.match(
      /\*\*Gaps to Consider:\*\*\s*\n([\s\S]*?)(?=\*\*|###|$)/i
    );
    const cons = consSection
      ? consSection[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.replace(/^-\s*/, '').trim())
          .filter(Boolean)
      : [];

    bundles.push({
      bundleId,
      bundleName,
      bundleSlug: '', // Will be populated from database lookup
      bundleImageUrl: undefined,
      price,
      itemCount: 0, // Will be populated from database lookup
      scenarios: [],
      reasoning,
      pros,
      cons,
      fitScore,
      priority,
    });
  }

  return bundles;
}

/**
 * Extract Survival Skills and parse into structured data
 */
function extractSkills(content: string): SkillItem[] {
  const section = extractSection(content, 'Survival Skills');
  if (!section) return [];

  const skills: SkillItem[] = [];

  // Match skill items with checkboxes and priority
  const skillPattern = /- \[[ x]\]\s*\*\*([^*]+)\*\*\s*-\s*([^(]+)\s*\(Priority:\s*(critical|important|helpful)\)/gi;
  let match;

  while ((match = skillPattern.exec(section)) !== null) {
    skills.push({
      skill: match[1].trim(),
      reason: match[2].trim(),
      priority: match[3].toLowerCase() as SkillPriority,
    });
  }

  // Fallback: try simpler pattern if structured format not found
  if (skills.length === 0) {
    const simplePattern = /- \[[ x]\]\s*\*\*([^*]+)\*\*\s*-\s*([^\n]+)/gi;
    while ((match = simplePattern.exec(section)) !== null) {
      const fullText = match[2].trim();
      // Try to extract priority from the text
      const priorityMatch = fullText.match(/\(Priority:\s*(critical|important|helpful)\)/i);
      const priority = priorityMatch ? priorityMatch[1].toLowerCase() as SkillPriority : 'important';
      const reason = fullText.replace(/\(Priority:\s*(?:critical|important|helpful)\)/i, '').trim();

      skills.push({
        skill: match[1].trim(),
        reason,
        priority,
      });
    }
  }

  return skills;
}

/**
 * Extract Day-by-Day Simulation and parse into structured data
 */
function extractSimulation(content: string): SimulationDay[] {
  const section = extractSection(content, 'Day-by-Day Simulation');
  if (!section) return [];

  const days: SimulationDay[] = [];

  // Split by H3 headings (each day/period)
  const dayBlocks = section.split(/###\s+/);

  for (const block of dayBlocks) {
    if (!block.trim()) continue;

    // Extract day identifier and title - more flexible pattern
    const titleMatch = block.match(/^(Day[s]?\s*[\d-]+|Week\s*\d+|Beyond\s*\d+\s*Days)[:\s]+(.+?)(?:\n|$)/i);
    if (!titleMatch) continue;

    const day = titleMatch[1].trim();
    const title = titleMatch[2].trim();

    // Extract narrative - look for text between title and Key Actions
    // Can be in brackets or just plain text
    let narrative = '';
    const bracketNarrativeMatch = block.match(
      /^(?:Day[s]?\s*[\d-]+|Week\s*\d+|Beyond\s*\d+\s*Days)[:\s]+[^\n]+\n\[([^\]]+)\]/i
    );
    if (bracketNarrativeMatch) {
      narrative = bracketNarrativeMatch[1].trim();
    } else {
      // Try plain paragraph
      const plainNarrativeMatch = block.match(
        /^(?:Day[s]?\s*[\d-]+|Week\s*\d+|Beyond\s*\d+\s*Days)[:\s]+[^\n]+\n+([^\n*#\[]+)/i
      );
      if (plainNarrativeMatch) {
        narrative = plainNarrativeMatch[1].trim();
      }
    }

    // Extract Key Actions
    const actionsSection = block.match(
      /\*\*Key Actions:\*\*\s*\n([\s\S]*?)(?=###|##|$)/i
    );
    const keyActions = actionsSection
      ? actionsSection[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.replace(/^-\s*/, '').trim())
          .filter(Boolean)
      : [];

    days.push({
      day,
      title,
      narrative,
      keyActions,
    });
  }

  return days;
}

/**
 * Extract Next Steps section
 */
function extractNextSteps(content: string): string[] {
  const section = extractSection(content, 'Next Steps');
  if (!section) return [];

  // Match numbered list items
  const steps = section
    .split('\n')
    .filter(line => /^\d+\.\s/.test(line.trim()))
    .map(line => line.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);

  // Also check for bold items with descriptions
  if (steps.length === 0) {
    const boldPattern = /\*\*([^*]+)\*\*\s*-?\s*(.+)/g;
    let match;
    while ((match = boldPattern.exec(section)) !== null) {
      steps.push(`${match[1].trim()}: ${match[2].trim()}`);
    }
  }

  return steps;
}

/**
 * Detect which section is currently being streamed
 */
export function detectCurrentSection(content: string): string | null {
  const headings = content.match(/^##\s+[^\n]+$/gm) || [];
  if (headings.length === 0) return null;

  const lastHeading = headings[headings.length - 1];

  if (/executive summary/i.test(lastHeading)) return 'executive-summary';
  if (/risk assessment/i.test(lastHeading)) return 'risk-assessment';
  if (/recommended bundles/i.test(lastHeading)) return 'recommended-bundles';
  if (/survival skills/i.test(lastHeading)) return 'survival-skills';
  if (/day-by-day|simulation/i.test(lastHeading)) return 'simulation';
  if (/next steps/i.test(lastHeading)) return 'next-steps';

  return null;
}

/**
 * Get list of completed sections from content
 */
export function getCompletedSections(content: string): string[] {
  const completed: string[] = [];
  const headings = content.match(/^##\s+[^\n]+$/gm) || [];

  // A section is complete if there's another section after it
  for (let i = 0; i < headings.length - 1; i++) {
    const heading = headings[i];
    if (/executive summary/i.test(heading)) completed.push('executive-summary');
    if (/risk assessment/i.test(heading)) completed.push('risk-assessment');
    if (/recommended bundles/i.test(heading)) completed.push('recommended-bundles');
    if (/survival skills/i.test(heading)) completed.push('survival-skills');
    if (/day-by-day|simulation/i.test(heading)) completed.push('simulation');
    if (/next steps/i.test(heading)) completed.push('next-steps');
  }

  return completed;
}

/**
 * Estimate progress based on content length and sections
 */
export function estimateProgress(content: string): number {
  const sections = getCompletedSections(content);
  const totalSections = 6;
  const sectionProgress = (sections.length / totalSections) * 100;

  // Also factor in content length (typical report is ~4000-6000 chars)
  const expectedLength = 5000;
  const lengthProgress = Math.min((content.length / expectedLength) * 100, 100);

  // Weight: 70% sections, 30% length
  return Math.round(sectionProgress * 0.7 + lengthProgress * 0.3);
}
