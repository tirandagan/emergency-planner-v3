// Climate Zone Detection Utility
// Latitude-based climate zone mapping for disaster preparedness planning

/**
 * Climate zones based on latitude ranges
 * Used to provide location-specific disaster preparedness recommendations
 */
export type ClimateZone =
  | 'Polar'
  | 'Subarctic'
  | 'Continental'
  | 'Temperate'
  | 'Subtropical'
  | 'Tropical';

/**
 * Detect climate zone from latitude coordinates
 * Based on simplified Köppen climate classification
 *
 * @param lat - Latitude (-90 to 90)
 * @returns Climate zone name
 *
 * @example
 * detectClimateZone(70) // => 'Polar'
 * detectClimateZone(40.7128) // NYC => 'Continental'
 * detectClimateZone(25.7617) // Miami => 'Subtropical'
 * detectClimateZone(0) // Equator => 'Tropical'
 */
export function detectClimateZone(lat: number): ClimateZone {
  const absLat = Math.abs(lat);

  // Polar: Above 66.5° (Arctic/Antarctic Circle)
  if (absLat >= 66.5) {
    return 'Polar';
  }

  // Subarctic: 60° to 66.5°
  if (absLat >= 60) {
    return 'Subarctic';
  }

  // Continental: 40° to 60°
  if (absLat >= 40) {
    return 'Continental';
  }

  // Temperate: 30° to 40°
  if (absLat >= 30) {
    return 'Temperate';
  }

  // Subtropical: 23.5° to 30° (between Tropic and 30°)
  if (absLat >= 23.5) {
    return 'Subtropical';
  }

  // Tropical: 0° to 23.5° (between Equator and Tropic)
  return 'Tropical';
}

/**
 * Get climate zone description with disaster preparedness context
 */
export function getClimateZoneDescription(zone: ClimateZone): string {
  const descriptions: Record<ClimateZone, string> = {
    Polar:
      'Extreme cold, long winters, limited growing season. Prepare for prolonged cold weather emergencies.',
    Subarctic:
      'Very cold winters, short summers. Prepare for extreme cold and winter storms.',
    Continental:
      'Four distinct seasons with cold winters and warm summers. Prepare for seasonal weather extremes.',
    Temperate:
      'Mild seasons with moderate temperatures. Prepare for seasonal storms and temperature variations.',
    Subtropical:
      'Hot humid summers, mild winters. Prepare for hurricanes, heat waves, and flooding.',
    Tropical:
      'Hot and humid year-round. Prepare for hurricanes, heavy rainfall, and tropical diseases.',
  };

  return descriptions[zone];
}

/**
 * Get typical disaster risks for a climate zone
 */
export function getClimateZoneRisks(zone: ClimateZone): string[] {
  const risks: Record<ClimateZone, string[]> = {
    Polar: ['Extreme cold', 'Blizzards', 'Ice storms', 'Isolation', 'Limited resources'],
    Subarctic: ['Severe winter storms', 'Extreme cold', 'Ice storms', 'Wildfires (summer)'],
    Continental: [
      'Tornadoes',
      'Blizzards',
      'Heat waves',
      'Floods',
      'Ice storms',
      'Severe thunderstorms',
    ],
    Temperate: ['Floods', 'Winter storms', 'Heat waves', 'Severe storms'],
    Subtropical: [
      'Hurricanes',
      'Floods',
      'Heat waves',
      'Droughts',
      'Severe thunderstorms',
      'Tornadoes',
    ],
    Tropical: [
      'Hurricanes',
      'Typhoons',
      'Flooding',
      'Extreme heat',
      'Tropical diseases',
      'Landslides',
    ],
  };

  return risks[zone];
}

/**
 * Test climate zone detection with known locations
 * Run this in development to verify accuracy
 */
export function testClimateZones() {
  const testCases = [
    { location: 'North Pole', lat: 90, expected: 'Polar' },
    { location: 'Barrow, Alaska', lat: 71.29, expected: 'Polar' },
    { location: 'Anchorage, Alaska', lat: 61.22, expected: 'Subarctic' },
    { location: 'New York City', lat: 40.71, expected: 'Continental' },
    { location: 'Chicago', lat: 41.88, expected: 'Continental' },
    { location: 'Los Angeles', lat: 34.05, expected: 'Temperate' },
    { location: 'Phoenix', lat: 33.45, expected: 'Temperate' },
    { location: 'Miami', lat: 25.76, expected: 'Subtropical' },
    { location: 'Houston', lat: 29.76, expected: 'Subtropical' },
    { location: 'Singapore', lat: 1.35, expected: 'Tropical' },
    { location: 'Quito, Ecuador', lat: -0.18, expected: 'Tropical' },
  ] as const;

  console.log('Climate Zone Detection Tests:');
  testCases.forEach(({ location, lat, expected }) => {
    const result = detectClimateZone(lat);
    const match = result === expected ? '✓' : '✗';
    console.log(`${match} ${location} (${lat}°): ${result} (expected: ${expected})`);
  });
}
