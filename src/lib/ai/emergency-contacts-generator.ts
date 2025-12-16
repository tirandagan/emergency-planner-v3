/**
 * Emergency Contacts Generator
 * Orchestrates AI generation of emergency contact recommendations
 * Combines static contacts, Google Places results, and AI analysis
 */

import { generateText } from 'ai';
import { openrouter } from '@/lib/openrouter';
import { getModelConfig } from './model-config';
import { logAIUsage } from './usage-logger';
import type { WizardFormData } from '@/types/wizard';
import type {
  EmergencyContactsSection,
  EmergencyContactRecommendation,
  MeetingLocationRecommendation,
  GooglePlaceResult,
} from '@/types/emergency-contacts';
import { getAllStaticContacts } from '@/lib/emergency-contacts/static-contacts';
import { getTierInstructionsSafe } from '@/lib/prompts/tier-variables';
import { readFileSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate emergency contacts section with AI analysis
 *
 * @param formData - User's wizard form data
 * @param userId - User ID for logging
 * @param userTier - User subscription tier (FREE/BASIC/PRO)
 * @param googlePlacesResults - Results from Google Places API
 * @returns Complete emergency contacts section
 */
export async function generateEmergencyContacts(
  formData: WizardFormData,
  userId: string,
  userTier: string,
  googlePlacesResults: GooglePlaceResult[] = []
): Promise<EmergencyContactsSection> {
  const startTime = Date.now();

  try {
    // Step 1: Get static contacts (universal + regional)
    const staticContacts = getAllStaticContacts(
      formData.location.country || 'US',
      formData.location.state
    );

    console.log(`📋 Loaded ${staticContacts.length} static contacts`);
    console.log(`🗺️ Received ${googlePlacesResults.length} Google Places results`);

    // Step 2: Build AI prompt
    const prompt = buildEmergencyContactsPrompt(
      formData,
      staticContacts,
      googlePlacesResults,
      userTier
    );

    // Step 3: Get model configuration
    const modelConfig = getModelConfig('emergency_contacts');
    const model = openrouter(modelConfig.primary);

    console.log(`🤖 Generating emergency contacts with ${modelConfig.primary}...`);

    // Step 4: Call AI
    const result = await generateText({
      model,
      prompt,
      temperature: modelConfig.temperature,
    });

    const durationMs = Date.now() - startTime;

    console.log(`✅ AI generation complete in ${durationMs}ms`);
    console.log(`📊 Tokens: ${result.usage.totalTokens} (${result.usage.inputTokens} in + ${result.usage.outputTokens} out)`);
    console.log(`📝 AI Response Preview:\n${result.text.substring(0, 500)}...`);

    // Step 5: Parse markdown response
    const { contacts, meetingLocations } = parseEmergencyContactsResponse(
      result.text,
      staticContacts,
      googlePlacesResults
    );

    console.log(`✅ Parsed ${contacts.length} contacts and ${meetingLocations.length} meeting locations`);

    // Fallback: If parsing failed to extract any contacts, use static contacts directly
    if (contacts.length === 0 && staticContacts.length > 0) {
      console.warn('⚠️ AI parsing returned no contacts, falling back to static contacts');
      return {
        contacts: staticContacts,
        meetingLocations,
        generatedAt: new Date().toISOString(),
        locationContext: `${formData.location.city}, ${formData.location.state || formData.location.country}`,
        googlePlacesUsed: googlePlacesResults.length > 0,
        aiAnalysisUsed: false, // Mark as false since we're using fallback
      };
    }

    // Step 6: Log AI usage
    await logAIUsage(
      userId,
      'emergency_contacts',
      modelConfig.primary,
      result.usage.inputTokens ?? 0,
      result.usage.outputTokens ?? 0,
      durationMs
    );

    // Step 7: Return section
    return {
      contacts,
      meetingLocations,
      generatedAt: new Date().toISOString(),
      locationContext: `${formData.location.city}, ${formData.location.state || formData.location.country}`,
      googlePlacesUsed: googlePlacesResults.length > 0,
      aiAnalysisUsed: true,
    };

  } catch (error) {
    console.error('❌ Emergency contacts generation failed:', error);

    // Graceful degradation: Return static contacts only
    const staticContacts = getAllStaticContacts(
      formData.location.country || 'US',
      formData.location.state
    );

    return {
      contacts: staticContacts,
      meetingLocations: [],
      generatedAt: new Date().toISOString(),
      locationContext: `${formData.location.city}, ${formData.location.state || formData.location.country}`,
      googlePlacesUsed: false,
      aiAnalysisUsed: false,
    };
  }
}

/**
 * Build AI prompt for emergency contacts generation
 */
function buildEmergencyContactsPrompt(
  formData: WizardFormData,
  staticContacts: EmergencyContactRecommendation[],
  googlePlacesResults: GooglePlaceResult[],
  userTier: string
): string {
  // Load prompt templates
  const systemPrompt = loadPromptTemplate('emergency-contacts/system-prompt.md');
  const outputFormat = loadPromptTemplate('emergency-contacts/output-format.md');

  // Get tier-specific instructions
  const tierInstructions = getTierInstructionsSafe('emergency_contacts', userTier);

  // Replace tier instructions variable
  const systemPromptWithTier = systemPrompt.replace(
    '{{tier_instructions:emergency_contacts}}',
    tierInstructions
  );

  // Build contact context
  const contactContext = buildContactContext(staticContacts, googlePlacesResults);

  // Calculate family demographics from familyMembers
  const adults = formData.familyMembers.filter(m => m.age >= 18 && m.age < 65).length;
  const children = formData.familyMembers.filter(m => m.age < 18).length;
  const seniors = formData.familyMembers.filter(m => m.age >= 65).length;
  const familySize = formData.familyMembers.length;
  const medicalNeeds = formData.familyMembers
    .filter(m => m.medicalConditions)
    .map(m => m.medicalConditions)
    .filter(Boolean);

  // Build user context
  const userContext = `
## User Context

**Location**: ${formData.location.city}, ${formData.location.state}, ${formData.location.country}
**Coordinates**: ${formData.location.coordinates.lat}, ${formData.location.coordinates.lng}
**Scenarios**: ${formData.scenarios.join(', ')}
**Family Size**: ${familySize} (${adults} adults, ${children} children, ${seniors} seniors)
**Medical Needs**: ${medicalNeeds.length > 0 ? medicalNeeds.join(', ') : 'None specified'}
**Duration**: ${formData.durationDays} days
**Home Type**: ${formData.homeType}
`;

  // Combine all parts
  return `${systemPromptWithTier}

${userContext}

${contactContext}

${outputFormat}

Now analyze the provided contacts and generate emergency contact recommendations following the exact output format above.
`;
}

/**
 * Build contact context from static and Google Places data
 */
function buildContactContext(
  staticContacts: EmergencyContactRecommendation[],
  googlePlacesResults: GooglePlaceResult[]
): string {
  let context = '## Available Contacts\n\n';

  context += '### Universal Emergency Contacts\n\n';
  staticContacts.forEach(contact => {
    context += `- **${contact.name}**\n`;
    context += `  Phone: ${contact.phone}\n`;
    if (contact.website) context += `  Website: ${contact.website}\n`;
    context += `  Category: ${contact.category}\n`;
    context += `  Priority: ${contact.priority}\n`;
    context += `  Region: ${contact.region}\n`;
    context += `  Scenarios: ${contact.relevantScenarios.join(', ')}\n\n`;
  });

  if (googlePlacesResults.length > 0) {
    context += '### Local Services (from Google Places)\n\n';
    googlePlacesResults.forEach(place => {
      context += `- **${place.name}**\n`;
      context += `  Place ID: ${place.placeId}\n`;
      context += `  Address: ${place.address}\n`;
      if (place.phone) context += `  Phone: ${place.phone}\n`;
      context += `  Types: ${place.types.join(', ')}\n`;
      if (place.rating) context += `  Rating: ${place.rating}/5 (${place.userRatingsTotal || 0} reviews)\n`;
      if (place.openNow !== undefined) context += `  Open Now: ${place.openNow ? 'Yes' : 'No'}\n`;
      context += `  Location: ${place.location.lat}, ${place.location.lng}\n\n`;
    });
  }

  return context;
}

/**
 * Parse AI-generated markdown response
 */
function parseEmergencyContactsResponse(
  markdownText: string,
  staticContacts: EmergencyContactRecommendation[],
  googlePlacesResults: GooglePlaceResult[]
): {
  contacts: EmergencyContactRecommendation[];
  meetingLocations: MeetingLocationRecommendation[];
} {
  const contacts: EmergencyContactRecommendation[] = [];
  const meetingLocations: MeetingLocationRecommendation[] = [];

  // Split by main sections
  const sections = markdownText.split('## ');
  console.log(`🔍 Parser: Found ${sections.length} sections after splitting by '## '`);

  // Track if we're in a contacts section (to handle AI using ## instead of ###)
  let inContactsSection = false;
  let inMeetingLocationsSection = false;

  for (const section of sections) {
    const trimmedSection = section.trim();
    const sectionHeader = trimmedSection.split('\n')[0];
    console.log(`📄 Parser: Examining section: "${sectionHeader}"`);

    // Check if this is the Emergency Contacts Analysis header
    if (trimmedSection.startsWith('Emergency Contacts Analysis')) {
      inContactsSection = true;
      inMeetingLocationsSection = false;

      // Try to parse with ### headers (correct format)
      const contactBlocks = trimmedSection.split('### ').slice(1);
      console.log(`👥 Parser: Found ${contactBlocks.length} contact blocks using ### headers`);

      for (const block of contactBlocks) {
        const contact = parseContactBlock(block, staticContacts, googlePlacesResults);
        if (contact) {
          console.log(`✅ Parser: Successfully parsed contact: ${contact.name}`);
          contacts.push(contact);
        }
      }
      continue;
    }

    // Check if this is the Meeting Locations header
    if (trimmedSection.startsWith('Meeting Locations')) {
      inContactsSection = false;
      inMeetingLocationsSection = true;

      // Try to parse with ### headers (correct format)
      const locationBlocks = trimmedSection.split('### ').slice(1);
      console.log(`📍 Parser: Found ${locationBlocks.length} meeting location blocks using ### headers`);

      for (const block of locationBlocks) {
        const location = parseMeetingLocationBlock(block);
        if (location) {
          console.log(`✅ Parser: Successfully parsed meeting location: ${location.name}`);
          meetingLocations.push(location);
        }
      }
      continue;
    }

    // If we're in contacts section and this section has contact fields, parse it
    // (handles AI using ## instead of ### for individual contacts)
    if (inContactsSection && trimmedSection.includes('**Phone**')) {
      console.log(`🔧 Parser: Parsing contact with ## header (AI format issue): "${sectionHeader}"`);
      const contact = parseContactBlock(trimmedSection, staticContacts, googlePlacesResults);
      if (contact) {
        console.log(`✅ Parser: Successfully parsed contact: ${contact.name}`);
        contacts.push(contact);
      } else {
        const blockPreview = trimmedSection.substring(0, 100).replace(/\n/g, ' ');
        console.warn(`❌ Parser: Failed to parse contact block: ${blockPreview}...`);
      }
    }

    // If we're in meeting locations section and this section has location fields, parse it
    if (inMeetingLocationsSection && (trimmedSection.includes('Meeting Location:') || trimmedSection.includes('**Address**'))) {
      console.log(`🔧 Parser: Parsing meeting location with ## header (AI format issue): "${sectionHeader}"`);
      const location = parseMeetingLocationBlock(trimmedSection);
      if (location) {
        console.log(`✅ Parser: Successfully parsed meeting location: ${location.name}`);
        meetingLocations.push(location);
      }
    }
  }

  console.log(`📊 Parser Final: ${contacts.length} contacts, ${meetingLocations.length} meeting locations`);
  return { contacts, meetingLocations };
}

/**
 * Parse individual contact block
 */
function parseContactBlock(
  block: string,
  staticContacts: EmergencyContactRecommendation[],
  googlePlacesResults: GooglePlaceResult[]
): EmergencyContactRecommendation | null {
  try {
    // Extract name from first line
    const lines = block.split('\n');
    const name = lines[0].trim();

    // Extract fields
    const phone = extractField(block, 'Phone');
    const address = extractField(block, 'Address');
    const website = extractField(block, 'Website');
    const category = extractField(block, 'Category') as any;
    const priority = extractField(block, 'Priority') as any;
    const fitScoreStr = extractField(block, 'Fit Score');
    const reasoning = extractField(block, 'Reasoning');
    const relevantScenariosStr = extractField(block, 'Relevant Scenarios');
    const available24hr = extractField(block, '24/7 Available');

    console.log(`🔍 Parsing contact block: "${name}"`);
    console.log(`  Phone: ${phone ? '✅' : '❌'} "${phone}"`);
    console.log(`  Category: ${category ? '✅' : '❌'} "${category}"`);
    console.log(`  Priority: ${priority ? '✅' : '❌'} "${priority}"`);
    console.log(`  Reasoning: ${reasoning ? '✅' : '❌'} "${reasoning?.substring(0, 50)}..."`);

    if (!name || !phone || !category || !priority || !reasoning) {
      console.warn(`⚠️ Skipping contact "${name}" due to missing required fields:`, {
        hasName: !!name,
        hasPhone: !!phone,
        hasCategory: !!category,
        hasPriority: !!priority,
        hasReasoning: !!reasoning
      });
      return null;
    }

    // Find matching Google Place for additional data
    const matchingPlace = googlePlacesResults.find(
      place => place.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(place.name.toLowerCase())
    );

    // Find matching static contact
    const matchingStatic = staticContacts.find(
      contact => contact.name.toLowerCase() === name.toLowerCase()
    );

    return {
      id: uuidv4(),
      name,
      type: matchingStatic?.type || matchingPlace ? 'professional' : 'agency',
      category: category || 'government',
      phone,
      website: website || matchingStatic?.website,
      address: address || matchingPlace?.address,
      reasoning,
      relevantScenarios: relevantScenariosStr?.split(',').map(s => s.trim()) || [],
      priority: priority || 'helpful',
      fitScore: parseInt(fitScoreStr || '80', 10),
      region: matchingStatic?.region || 'local',
      availability24hr: available24hr?.toLowerCase() === 'yes',
      source: matchingStatic ? 'static' : (matchingPlace ? 'google_places' : 'ai'),
      placeId: matchingPlace?.placeId,
      location: matchingPlace?.location,
    };
  } catch (error) {
    console.error('Error parsing contact block:', error);
    return null;
  }
}

/**
 * Parse meeting location block
 */
function parseMeetingLocationBlock(block: string): MeetingLocationRecommendation | null {
  try {
    const lines = block.split('\n');
    const firstLine = lines[0].trim();

    // Extract priority and name from "Primary Meeting Location: Name"
    let priority: 'primary' | 'secondary' | 'tertiary' = 'primary';
    let name = firstLine;

    if (firstLine.toLowerCase().includes('primary')) {
      priority = 'primary';
      name = firstLine.replace(/primary meeting location:/i, '').trim();
    } else if (firstLine.toLowerCase().includes('secondary')) {
      priority = 'secondary';
      name = firstLine.replace(/secondary meeting location:/i, '').trim();
    } else if (firstLine.toLowerCase().includes('tertiary')) {
      priority = 'tertiary';
      name = firstLine.replace(/tertiary meeting location:/i, '').trim();
    }

    const address = extractField(block, 'Address');
    const description = extractField(block, 'Description');
    const reasoning = extractField(block, 'Reasoning');
    const practicalDetails = extractField(block, 'Practical Details');
    const suitableForStr = extractField(block, 'Suitable For');

    if (!name || !address || !reasoning) {
      console.warn('Skipping meeting location due to missing required fields');
      return null;
    }

    return {
      id: uuidv4(),
      name,
      address,
      description: description || reasoning,
      placeId: '', // Would need geocoding to get place ID
      location: { lat: 0, lng: 0 }, // Would need geocoding
      placeType: 'meeting_point',
      reasoning,
      scenarioSuitability: suitableForStr?.split(',').map(s => s.trim()) || [],
      priority,
      isPublic: true,
      hasParking: practicalDetails?.toLowerCase().includes('parking') || false,
      isAccessible: practicalDetails?.toLowerCase().includes('accessible') ||
        practicalDetails?.toLowerCase().includes('ada') || false,
    };
  } catch (error) {
    console.error('Error parsing meeting location block:', error);
    return null;
  }
}

/**
 * Extract field value from markdown block
 */
function extractField(block: string, fieldName: string): string | undefined {
  const regex = new RegExp(`\\*\\*${fieldName}\\*\\*:?\\s*(.+?)(?:\\n|$)`, 'i');
  const match = block.match(regex);
  return match ? match[1].trim() : undefined;
}

/**
 * Load prompt template from file system
 */
function loadPromptTemplate(relativePath: string): string {
  try {
    const promptsDir = join(process.cwd(), 'prompts');
    const fullPath = join(promptsDir, relativePath);
    return readFileSync(fullPath, 'utf-8');
  } catch (error) {
    console.error(`Failed to load prompt template: ${relativePath}`, error);
    return '';
  }
}
