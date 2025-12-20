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

  console.log('🔄 Transform - Input report:', {
    id: report.id,
    personnelData: report.personnelData,
    familySize: report.familySize,
  });

  // Step 1: Scenarios
  if (report.scenarios && Array.isArray(report.scenarios)) {
    wizardData.scenarios = report.scenarios as ScenarioType[];
  }

  // Step 2: Personnel - Extract from personnelData if available
  if (report.personnelData && Array.isArray(report.personnelData) && report.personnelData.length > 0) {
    // Use stored personnel data from the database
    console.log('✅ Using personnelData from database:', report.personnelData);
    wizardData.familyMembers = report.personnelData as FamilyMember[];
  } else if (report.familySize) {
    // Fallback: Create placeholders based on familySize for old reports
    console.log('⚠️ No personnelData found, creating placeholders for familySize:', report.familySize);
    wizardData.familyMembers = Array.from({ length: report.familySize }, (_, i) => ({
      age: 30, // Default age
      medicalConditions: '',
      specialNeeds: '',
    }));
  }

  console.log('🔄 Transform - Output familyMembers:', wizardData.familyMembers);

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
    data.homeType
  );
}
