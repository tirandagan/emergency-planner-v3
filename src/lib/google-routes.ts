/**
 * Google Routes API v2 Integration with Geocoding
 * Converts waypoint names to coordinates, then computes vehicle routes
 */

import type { Waypoint } from '@/types/wizard';

interface ComputedRoute {
  polyline: { lat: number; lng: number }[];
  distance: string;
  duration: string;
}

// Geocoding cache to minimize API calls
const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

// Route computation cache to avoid redundant API calls
const routeCache = new Map<string, ComputedRoute>();

/**
 * Geocode a single waypoint name to coordinates using Google Geocoding API
 * Results are cached to minimize API calls
 */
export async function geocodeWaypoint(
  waypointName: string
): Promise<{ lat: number; lng: number } | null> {
  // Check cache first
  if (geocodeCache.has(waypointName)) {
    return geocodeCache.get(waypointName)!;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?` +
      `address=${encodeURIComponent(waypointName)}&` +
      `key=${process.env.NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY}`
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error?.message || data.error_message || response.statusText;
      const errorDetails = data.error?.status || data.status || 'UNKNOWN_ERROR';
      throw new Error(
        `Geocoding API error (${response.status}): ${errorDetails} - ${errorMessage}. ` +
        `Check that Geocoding API is enabled in Google Cloud Console.`
      );
    }

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      const coords = { lat: location.lat, lng: location.lng };

      // Cache the result
      geocodeCache.set(waypointName, coords);
      return coords;
    }

    // Handle specific error statuses
    if (data.status === 'ZERO_RESULTS') {
      console.warn(`No geocoding results found for: "${waypointName}"`);
    } else if (data.status !== 'OK') {
      console.warn(`Geocoding API returned status ${data.status} for: "${waypointName}"`);
    }

    // Cache null result to avoid repeated failed lookups
    geocodeCache.set(waypointName, null);
    return null;
  } catch (error) {
    console.error('Geocoding error for waypoint:', waypointName, error);
    return null;
  }
}

/**
 * Geocode all waypoints in batch
 * Returns waypoints with coordinates populated
 * Throws error if any waypoint fails to geocode
 */
export async function geocodeWaypoints(
  waypoints: Waypoint[]
): Promise<(Waypoint & { lat: number; lng: number })[]> {
  const geocodedWaypoints = await Promise.all(
    waypoints.map(async (waypoint) => {
      // If coordinates already exist (legacy data), use them
      if (waypoint.lat !== undefined && waypoint.lng !== undefined) {
        return waypoint as Waypoint & { lat: number; lng: number };
      }

      // Geocode the waypoint name
      const coords = await geocodeWaypoint(waypoint.name);

      if (coords) {
        return { ...waypoint, ...coords, geocoded: true };
      }

      // Failed to geocode
      throw new Error(
        `Failed to geocode waypoint: "${waypoint.name}". ` +
        `Please ensure the waypoint name is a specific, Google Maps-identifiable location.`
      );
    })
  );

  return geocodedWaypoints;
}

function getCacheKey(waypoints: Waypoint[]): string {
  return waypoints.map((wp) => `${wp.lat},${wp.lng}`).join('|');
}

export async function computeRouteWithWaypoints(
  waypoints: (Waypoint & { lat: number; lng: number })[]
): Promise<ComputedRoute | null> {
  if (waypoints.length < 2) return null;

  // Check cache first
  const cacheKey = getCacheKey(waypoints);
  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  try {
    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const intermediates = waypoints.slice(1, -1);

    // Construct Routes API v2 request
    const requestBody = {
      origin: {
        location: {
          latLng: {
            latitude: origin.lat,
            longitude: origin.lng,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: destination.lat,
            longitude: destination.lng,
          },
        },
      },
      intermediates: intermediates.map((wp) => ({
        location: {
          latLng: {
            latitude: wp.lat,
            longitude: wp.lng,
          },
        },
      })),
      travelMode: 'DRIVE',
      routingPreference: 'TRAFFIC_AWARE',
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls: false,
        avoidHighways: false,
        avoidFerries: false,
      },
    };

    const response = await fetch(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': process.env.NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY || '',
          'X-Goog-FieldMask': 'routes.polyline,routes.distanceMeters,routes.duration',
        },
        body: JSON.stringify(requestBody),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.error?.message || response.statusText || 'Unknown error';
      const errorStatus = data.error?.status || 'UNKNOWN_ERROR';
      const errorCode = data.error?.code || response.status;

      // Provide helpful error messages for common issues
      let helpText = '';
      if (errorMessage.includes('API key not valid') || errorMessage.includes('API_KEY_INVALID')) {
        helpText = 'Check your NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY in .env.local';
      } else if (errorMessage.includes('not enabled') || errorStatus === 'PERMISSION_DENIED') {
        helpText = 'Enable Routes API in Google Cloud Console (APIs & Services → Library → "Routes API")';
      } else if (errorMessage.includes('billing')) {
        helpText = 'Enable billing for your Google Cloud project';
      }

      throw new Error(
        `Routes API error (${errorCode}): ${errorStatus} - ${errorMessage}` +
        (helpText ? `. ${helpText}` : '')
      );
    }

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No routes returned from API. Check that waypoints are valid locations.');
    }

    const route = data.routes[0];

    // Decode polyline (Routes API v2 uses encoded polyline)
    const polyline = decodePolyline(route.polyline.encodedPolyline);

    const computed: ComputedRoute = {
      polyline,
      distance: `${(route.distanceMeters / 1000).toFixed(1)} km`,
      duration: formatDuration(route.duration),
    };

    // Cache the result
    routeCache.set(cacheKey, computed);

    return computed;
  } catch (error) {
    console.error('Error computing route:', error);
    return null;
  }
}

// Decode Google's encoded polyline format
function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
}

function formatDuration(duration: string): string {
  // Duration comes as "3600s" format
  const seconds = parseInt(duration.replace('s', ''));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}
