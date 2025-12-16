'use server';

/**
 * Google Maps Geocoding API Integration
 * Converts waypoint names to geographic coordinates
 */

/**
 * Geocode a waypoint name to coordinates using Google Maps Geocoding API
 * @param waypointName - Descriptive name like "Main St and Oak Ave intersection"
 * @param locationContext - Context like "Seattle, WA" to improve accuracy
 * @returns Coordinates {lat, lng} or null if geocoding fails
 */
export async function geocodeWaypoint(
  waypointName: string,
  locationContext: string
): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY;

  if (!apiKey) {
    console.error('❌ NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY not configured');
    console.error('   Please set this environment variable in .env.local');
    return null;
  }

  // Validate API key format
  if (!apiKey.startsWith('AIza')) {
    console.error('❌ Invalid API key format. Google API keys should start with "AIza"');
    console.error(`   Current key starts with: ${apiKey.substring(0, 4)}...`);
    return null;
  }

  try {
    // Combine waypoint name with location context for better accuracy
    const address = `${waypointName}, ${locationContext}`;

    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('address', address);
    url.searchParams.set('key', apiKey);

    console.log(`🔍 Geocoding request: "${address}"`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error(`❌ Geocoding API HTTP error: ${response.status} ${response.statusText}`);
      console.error(`   URL: ${url.origin}${url.pathname}`);
      console.error(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers))}`);
      return null;
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      console.error(`❌ Geocoding API error for "${waypointName}"`);
      console.error(`   Status: ${data.status}`);
      console.error(`   Error message: ${data.error_message || 'No error message provided'}`);
      console.error(`   Full response:`, JSON.stringify(data, null, 2));

      // Provide specific guidance based on error type
      if (data.status === 'REQUEST_DENIED') {
        console.error(`\n⚠️  REQUEST_DENIED indicates one of the following:`);
        console.error(`   1. Geocoding API is not enabled in Google Cloud Console`);
        console.error(`   2. API key restrictions prevent access to Geocoding API`);
        console.error(`   3. Billing is not enabled for the project`);
        console.error(`\n   → To fix: Go to Google Cloud Console → APIs & Services → Library`);
        console.error(`             Search "Geocoding API" and click Enable`);
        console.error(`             Verify API key allows Geocoding API under credentials settings\n`);
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        console.error(`   → You have exceeded your API quota. Check billing and usage limits.`);
      } else if (data.status === 'INVALID_REQUEST') {
        console.error(`   → The request was invalid. Check the address format: "${address}"`);
      } else if (data.status === 'ZERO_RESULTS') {
        console.error(`   → No results found for address: "${address}"`);
      }

      return null;
    }

    if (!data.results || data.results.length === 0) {
      console.warn(`⚠️ No geocoding results for "${waypointName}"`);
      console.warn(`   Address searched: "${address}"`);
      return null;
    }

    const { lat, lng } = data.results[0].geometry.location;
    const formattedAddress = data.results[0].formatted_address;
    console.log(`✅ Geocoded "${waypointName}"`);
    console.log(`   → ${lat}, ${lng}`);
    console.log(`   → Matched: ${formattedAddress}`);

    return { lat, lng };
  } catch (error) {
    console.error(`❌ Geocoding exception for "${waypointName}":`, error instanceof Error ? error.message : error);
    console.error(`   Stack trace:`, error instanceof Error ? error.stack : 'N/A');
    return null;
  }
}

/**
 * Geocode multiple waypoints with error handling
 * Filters out failed geocodes (returns only successfully geocoded waypoints)
 */
export async function geocodeWaypoints(
  waypoints: Array<{ name: string; description?: string }>,
  locationContext: string
): Promise<Array<{ lat: number; lng: number; name: string; description?: string }>> {
  console.log(`\n📍 Geocoding batch: ${waypoints.length} waypoints in "${locationContext}"`);

  const geocodedWaypoints = await Promise.all(
    waypoints.map(async (wp, index) => {
      console.log(`   [${index + 1}/${waypoints.length}] Processing: ${wp.name}`);
      const coords = await geocodeWaypoint(wp.name, locationContext);

      if (coords) {
        return { ...wp, lat: coords.lat, lng: coords.lng };
      } else {
        // Return with 0,0 to mark as failed (will be filtered out)
        console.warn(`   ⚠️ Failed to geocode waypoint: ${wp.name}`);
        return { ...wp, lat: 0, lng: 0 };
      }
    })
  );

  // Filter out failed geocodes (0,0 coordinates)
  const successful = geocodedWaypoints.filter(wp => wp.lat !== 0 && wp.lng !== 0);
  const failed = waypoints.length - successful.length;

  console.log(`\n📊 Geocoding batch complete:`);
  console.log(`   ✅ Successful: ${successful.length}/${waypoints.length}`);
  if (failed > 0) {
    console.error(`   ❌ Failed: ${failed}/${waypoints.length}`);
    console.error(`   Failed waypoints will be excluded from the route`);
  }
  console.log('');

  return successful;
}
