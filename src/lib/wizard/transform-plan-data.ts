/**
 * Transform Plan Data Utility
 * Converts mission report data back to wizard form data for editing
 */

import type { WizardFormData, ScenarioType, FamilyMember, LocationData } from '@/types/wizard';
import type { MissionReport } from '@/lib/mission-reports';

/**
 * Transform a mission report back to wizard form data
 * This allows users to edit their plans by pre-populating the wizard
 */
export function transformReportToWizardData(report: MissionReport): Partial<WizardFormData> {
  const wizardData: Partial<WizardFormData> = {};

  // Step 1: Scenarios
  if (report.scenarios && Array.isArray(report.scenarios)) {
    wizardData.scenarios = report.scenarios as ScenarioType[];
  }

  // Step 2: Personnel - Extract from report data if available
  // The original wizard stores family members, but the report stores familySize
  // We'll create a basic structure based on familySize
  if (report.familySize) {
    // Create family members array based on family size
    // We don't have detailed member info in the report, so create placeholders
    wizardData.familyMembers = Array.from({ length: report.familySize }, (_, i) => ({
      age: 30, // Default age
      medicalConditions: '',
      specialNeeds: '',
    }));
  }

  // Step 3: Location & Context
  if (report.location) {
    // Parse location string (format: "City, State" or full address)
    const locationParts = report.location.split(',').map((part) => part.trim());

    wizardData.location = {
      city: locationParts[0] || '',
      state: locationParts[1] || '',
      country: 'United States',
      coordinates: {
        lat: 0, // Would need to geocode to get exact coordinates
        lng: 0,
      },
      climateZone: '',
      fullAddress: report.location,
      placeId: '',
    } as LocationData;
  }

  if (report.durationDays) {
    wizardData.durationDays = report.durationDays;
  }

  // Map mobility type to home type (these are different in the schema)
  // mobilityType is not the same as homeType, so we'll use a default
  wizardData.homeType = 'house'; // Default

  // Existing preparedness level (not stored in report, use default)
  wizardData.existingPreparedness = 'basic';

  // Budget tier - map from budget amount
  if (report.budgetAmount) {
    const budgetNum = parseFloat(report.budgetAmount.replace(/[^0-9.-]+/g, ''));
    if (!isNaN(budgetNum)) {
      if (budgetNum < 500) {
        wizardData.budgetTier = 'LOW';
      } else if (budgetNum < 1500) {
        wizardData.budgetTier = 'MEDIUM';
      } else {
        wizardData.budgetTier = 'HIGH';
      }
    }
  } else {
    wizardData.budgetTier = 'MEDIUM'; // Default
  }

  return wizardData;
}

/**
 * Extract location data from a location string
 * Helper function for more detailed location parsing
 */
export function parseLocationString(locationStr: string): Partial<LocationData> {
  const parts = locationStr.split(',').map((part) => part.trim());

  return {
    city: parts[0] || '',
    state: parts[1] || '',
    country: parts[2] || 'United States',
    fullAddress: locationStr,
    placeId: '',
    coordinates: {
      lat: 0,
      lng: 0,
    },
    climateZone: '',
  };
}

/**
 * Check if wizard data is complete enough to proceed
 */
export function isWizardDataComplete(data: Partial<WizardFormData>): boolean {
  return !!(
    data.scenarios &&
    data.scenarios.length > 0 &&
    data.familyMembers &&
    data.familyMembers.length > 0 &&
    data.location &&
    data.durationDays &&
    data.homeType &&
    data.budgetTier
  );
}
