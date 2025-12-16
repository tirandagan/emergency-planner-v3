/**
 * Static Emergency Contacts Library
 * Hardcoded universal and regional emergency contacts (no database or API calls)
 * Provides instant fallback contacts when other services fail
 */

import type { EmergencyContactRecommendation } from '@/types/emergency-contacts';
import { v4 as uuidv4 } from 'uuid';

/**
 * Universal Emergency Contacts (United States)
 * These contacts are applicable nationwide and should always be included
 */
const UNIVERSAL_CONTACTS_US: EmergencyContactRecommendation[] = [
  {
    id: uuidv4(),
    name: 'Emergency Services (911)',
    type: 'agency',
    category: 'government',
    phone: '911',
    reasoning: 'Universal emergency number for immediate police, fire, and medical emergencies across the United States',
    relevantScenarios: ['natural-disaster', 'civil-unrest', 'nuclear', 'emp-grid-down', 'pandemic', 'multi-year-sustainability'],
    priority: 'critical',
    fitScore: 100,
    region: 'national',
    availability24hr: true,
    source: 'static',
  },
  {
    id: uuidv4(),
    name: 'National Poison Control Hotline',
    type: 'agency',
    category: 'medical',
    phone: '+1-800-222-1222',
    website: 'https://www.poison.org',
    reasoning: 'Expert guidance for poisoning emergencies, chemical exposures, and medication overdoses',
    relevantScenarios: ['natural-disaster', 'pandemic', 'multi-year-sustainability'],
    priority: 'critical',
    fitScore: 95,
    region: 'national',
    availability24hr: true,
    source: 'static',
  },
  {
    id: uuidv4(),
    name: '988 Suicide & Crisis Lifeline',
    type: 'agency',
    category: 'medical',
    phone: '988',
    website: 'https://988lifeline.org',
    reasoning: 'Mental health crisis support and suicide prevention - critical during disasters and emergencies',
    relevantScenarios: ['natural-disaster', 'civil-unrest', 'pandemic', 'multi-year-sustainability'],
    priority: 'important',
    fitScore: 90,
    region: 'national',
    availability24hr: true,
    source: 'static',
  },
  {
    id: uuidv4(),
    name: 'FEMA National Disaster Hotline',
    type: 'agency',
    category: 'government',
    phone: '+1-800-621-3362',
    website: 'https://www.fema.gov',
    reasoning: 'Federal Emergency Management Agency - disaster assistance, shelter locations, and emergency resources',
    relevantScenarios: ['natural-disaster', 'nuclear', 'emp-grid-down', 'multi-year-sustainability'],
    priority: 'important',
    fitScore: 95,
    region: 'national',
    availability24hr: true,
    source: 'static',
  },
  {
    id: uuidv4(),
    name: 'American Red Cross',
    type: 'agency',
    category: 'community',
    phone: '+1-800-733-2767',
    website: 'https://www.redcross.org',
    reasoning: 'Emergency shelter, disaster relief, blood services, and first aid assistance',
    relevantScenarios: ['natural-disaster', 'pandemic', 'civil-unrest', 'multi-year-sustainability'],
    priority: 'important',
    fitScore: 92,
    region: 'national',
    availability24hr: true,
    source: 'static',
  },
  {
    id: uuidv4(),
    name: 'CDC Emergency Hotline',
    type: 'agency',
    category: 'medical',
    phone: '+1-800-232-4636',
    website: 'https://www.cdc.gov',
    reasoning: 'Centers for Disease Control - pandemic guidance, disease outbreak information, and public health emergencies',
    relevantScenarios: ['pandemic', 'nuclear', 'natural-disaster'],
    priority: 'important',
    fitScore: 90,
    region: 'national',
    availability24hr: true,
    source: 'static',
  },
  {
    id: uuidv4(),
    name: 'National Domestic Violence Hotline',
    type: 'agency',
    category: 'community',
    phone: '+1-800-799-7233',
    website: 'https://www.thehotline.org',
    reasoning: 'Crisis support for domestic violence situations, often escalated during disasters and civil unrest',
    relevantScenarios: ['civil-unrest', 'multi-year-sustainability'],
    priority: 'helpful',
    fitScore: 85,
    region: 'national',
    availability24hr: true,
    source: 'static',
  },
  {
    id: uuidv4(),
    name: 'SAMHSA National Helpline',
    type: 'agency',
    category: 'medical',
    phone: '+1-800-662-4357',
    website: 'https://www.samhsa.gov',
    reasoning: 'Substance Abuse and Mental Health Services - treatment referrals and information during crises',
    relevantScenarios: ['pandemic', 'civil-unrest', 'multi-year-sustainability'],
    priority: 'helpful',
    fitScore: 85,
    region: 'national',
    availability24hr: true,
    source: 'static',
  },
];

/**
 * State Emergency Management Agencies
 * Top 20 US states by population
 */
const STATE_EMERGENCY_CONTACTS: Record<string, EmergencyContactRecommendation[]> = {
  CA: [
    {
      id: uuidv4(),
      name: 'California Office of Emergency Services',
      type: 'agency',
      category: 'government',
      phone: '+1-916-845-8510',
      website: 'https://www.caloes.ca.gov',
      reasoning: 'State-level emergency coordination for earthquakes, wildfires, floods, and other disasters',
      relevantScenarios: ['natural-disaster', 'civil-unrest', 'emp-grid-down'],
      priority: 'important',
      fitScore: 92,
      region: 'state',
      availability24hr: true,
      source: 'static',
    },
  ],
  TX: [
    {
      id: uuidv4(),
      name: 'Texas Division of Emergency Management',
      type: 'agency',
      category: 'government',
      phone: '+1-512-424-2138',
      website: 'https://tdem.texas.gov',
      reasoning: 'State emergency management for hurricanes, floods, tornadoes, and extreme weather',
      relevantScenarios: ['natural-disaster', 'emp-grid-down', 'multi-year-sustainability'],
      priority: 'important',
      fitScore: 92,
      region: 'state',
      availability24hr: true,
      source: 'static',
    },
  ],
  FL: [
    {
      id: uuidv4(),
      name: 'Florida Division of Emergency Management',
      type: 'agency',
      category: 'government',
      phone: '+1-850-815-4000',
      website: 'https://www.floridadisaster.org',
      reasoning: 'Hurricane and tropical storm preparedness, evacuation routes, and shelter information',
      relevantScenarios: ['natural-disaster', 'pandemic'],
      priority: 'important',
      fitScore: 93,
      region: 'state',
      availability24hr: true,
      source: 'static',
    },
  ],
  NY: [
    {
      id: uuidv4(),
      name: 'New York State Emergency Management',
      type: 'agency',
      category: 'government',
      phone: '+1-518-292-2200',
      website: 'https://www.dhses.ny.gov',
      reasoning: 'State emergency operations center for natural disasters, civil unrest, and public health emergencies',
      relevantScenarios: ['natural-disaster', 'civil-unrest', 'pandemic'],
      priority: 'important',
      fitScore: 91,
      region: 'state',
      availability24hr: true,
      source: 'static',
    },
  ],
  PA: [
    {
      id: uuidv4(),
      name: 'Pennsylvania Emergency Management Agency',
      type: 'agency',
      category: 'government',
      phone: '+1-717-651-2001',
      website: 'https://www.pema.pa.gov',
      reasoning: 'State disaster response coordination and emergency shelter information',
      relevantScenarios: ['natural-disaster', 'nuclear', 'multi-year-sustainability'],
      priority: 'important',
      fitScore: 90,
      region: 'state',
      availability24hr: true,
      source: 'static',
    },
  ],
  IL: [
    {
      id: uuidv4(),
      name: 'Illinois Emergency Management Agency',
      type: 'agency',
      category: 'government',
      phone: '+1-217-782-2700',
      website: 'https://www2.illinois.gov/iema',
      reasoning: 'Tornado, flood, and winter storm emergency coordination',
      relevantScenarios: ['natural-disaster', 'emp-grid-down'],
      priority: 'important',
      fitScore: 90,
      region: 'state',
      availability24hr: true,
      source: 'static',
    },
  ],
  OH: [
    {
      id: uuidv4(),
      name: 'Ohio Emergency Management Agency',
      type: 'agency',
      category: 'government',
      phone: '+1-614-889-7150',
      website: 'https://ema.ohio.gov',
      reasoning: 'State emergency response for severe weather and industrial incidents',
      relevantScenarios: ['natural-disaster', 'nuclear'],
      priority: 'important',
      fitScore: 89,
      region: 'state',
      availability24hr: true,
      source: 'static',
    },
  ],
  GA: [
    {
      id: uuidv4(),
      name: 'Georgia Emergency Management Agency',
      type: 'agency',
      category: 'government',
      phone: '+1-404-635-7000',
      website: 'https://gema.georgia.gov',
      reasoning: 'Hurricane, tornado, and severe weather emergency coordination',
      relevantScenarios: ['natural-disaster', 'civil-unrest'],
      priority: 'important',
      fitScore: 90,
      region: 'state',
      availability24hr: true,
      source: 'static',
    },
  ],
  NC: [
    {
      id: uuidv4(),
      name: 'North Carolina Emergency Management',
      type: 'agency',
      category: 'government',
      phone: '+1-919-825-2500',
      website: 'https://www.ncdps.gov/ncem',
      reasoning: 'Hurricane and flood emergency management and evacuation assistance',
      relevantScenarios: ['natural-disaster'],
      priority: 'important',
      fitScore: 91,
      region: 'state',
      availability24hr: true,
      source: 'static',
    },
  ],
  MI: [
    {
      id: uuidv4(),
      name: 'Michigan Emergency Management',
      type: 'agency',
      category: 'government',
      phone: '+1-517-284-3969',
      website: 'https://www.michigan.gov/msp/divisions/emhsd',
      reasoning: 'Winter storm, flooding, and public safety emergency coordination',
      relevantScenarios: ['natural-disaster', 'emp-grid-down'],
      priority: 'important',
      fitScore: 89,
      region: 'state',
      availability24hr: true,
      source: 'static',
    },
  ],
  // Additional states can be added here (NJ, VA, WA, AZ, MA, TN, IN, MO, MD, WI)
  // Placeholder for remaining top 20 states
};

/**
 * Get universal emergency contacts for a country
 */
export function getUniversalContacts(country: string = 'US'): EmergencyContactRecommendation[] {
  if (country === 'US' || country === 'USA') {
    return [...UNIVERSAL_CONTACTS_US];
  }

  // Add other countries as needed
  return UNIVERSAL_CONTACTS_US; // Default to US
}

/**
 * Get state-level emergency management contacts
 */
export function getStateEmergencyContacts(stateCode: string): EmergencyContactRecommendation[] {
  const upperStateCode = stateCode.toUpperCase();
  return STATE_EMERGENCY_CONTACTS[upperStateCode] || [];
}

/**
 * Get all static contacts (universal + state)
 */
export function getAllStaticContacts(
  country: string = 'US',
  stateCode?: string
): EmergencyContactRecommendation[] {
  const universal = getUniversalContacts(country);

  if (stateCode) {
    const stateContacts = getStateEmergencyContacts(stateCode);
    return [...universal, ...stateContacts];
  }

  return universal;
}

/**
 * Filter static contacts by scenario
 */
export function getContactsByScenario(
  scenario: string,
  country: string = 'US',
  stateCode?: string
): EmergencyContactRecommendation[] {
  const allContacts = getAllStaticContacts(country, stateCode);
  return allContacts.filter(contact =>
    contact.relevantScenarios.includes(scenario)
  );
}

/**
 * Get critical (911-level) contacts only
 */
export function getCriticalContacts(
  country: string = 'US'
): EmergencyContactRecommendation[] {
  const contacts = getUniversalContacts(country);
  return contacts.filter(contact => contact.priority === 'critical');
}
