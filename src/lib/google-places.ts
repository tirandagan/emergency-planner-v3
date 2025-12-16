/**
 * Google Places API Helper Functions
 * Provides clean interface for fetching emergency services with caching
 */

import type { GooglePlaceResult } from '@/types/emergency-contacts';

export interface EmergencyServicesResponse {
  services: GooglePlaceResult[];
  cached: boolean;
  cacheAge?: number; // minutes
}

/**
 * Fetch emergency services from Google Places API via our caching endpoint
 *
 * @param lat - Latitude (-90 to 90)
 * @param lng - Longitude (-180 to 180)
 * @param radius - Search radius in meters (default: 16093 = 10 miles)
 * @param types - Array of place types to search for
 * @returns Array of GooglePlaceResult objects (empty array on error)
 */
export async function fetchEmergencyServices(
  lat: number,
  lng: number,
  radius: number = 16093, // 10 miles in meters
  types: string[] = [
    'hospital',
    'police',
    'fire_station',
    'pharmacy',
    'library',
    'park',
    'local_government_office'
  ]
): Promise<GooglePlaceResult[]> {
  try {
    // Validate inputs
    if (lat < -90 || lat > 90) {
      console.error('Invalid latitude:', lat);
      return [];
    }

    if (lng < -180 || lng > 180) {
      console.error('Invalid longitude:', lng);
      return [];
    }

    if (radius < 0 || radius > 50000) {
      console.error('Invalid radius:', radius);
      return [];
    }

    // Check if Google API key is configured
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY;
    if (!googleApiKey) {
      console.error('NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY not configured');
      return [];
    }

    // Call Google Places API directly (server-side)
    const placesUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    placesUrl.searchParams.set('location', `${lat},${lng}`);
    placesUrl.searchParams.set('radius', radius.toString());
    if (types.length > 0) {
      placesUrl.searchParams.set('type', types.join('|'));
    }
    placesUrl.searchParams.set('key', googleApiKey);

    console.log(`🔍 Fetching places near ${lat},${lng} with radius ${radius}m`);

    const response = await fetch(placesUrl.toString());

    if (!response.ok) {
      console.error('Google Places API HTTP error:', response.statusText);
      return [];
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      return [];
    }

    // Transform results to our format
    const services: GooglePlaceResult[] = (data.results || []).map((place: any) => ({
      placeId: place.place_id,
      name: place.name,
      types: place.types || [],
      address: place.vicinity || place.formatted_address || '',
      phone: place.formatted_phone_number,
      location: {
        lat: place.geometry?.location?.lat || 0,
        lng: place.geometry?.location?.lng || 0,
      },
      openNow: place.opening_hours?.open_now,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      photos: place.photos?.slice(0, 3).map((photo: any) => ({
        photoReference: photo.photo_reference,
        width: photo.width,
        height: photo.height,
      })),
    }));

    console.log(`✅ Found ${services.length} emergency services from Google Places`);

    return services;

  } catch (error) {
    console.error('Failed to fetch emergency services:', error);
    return []; // Graceful degradation - return empty array
  }
}

/**
 * Fetch specific types of emergency services
 * Convenience wrappers for common use cases
 */

export async function fetchMedicalServices(
  lat: number,
  lng: number,
  radius: number = 16093
): Promise<GooglePlaceResult[]> {
  return fetchEmergencyServices(lat, lng, radius, ['hospital', 'doctor', 'pharmacy']);
}

export async function fetchEmergencyResponders(
  lat: number,
  lng: number,
  radius: number = 16093
): Promise<GooglePlaceResult[]> {
  return fetchEmergencyServices(lat, lng, radius, ['police', 'fire_station']);
}

export async function fetchMeetingPlaceCandidates(
  lat: number,
  lng: number,
  radius: number = 8046 // 5 miles
): Promise<GooglePlaceResult[]> {
  return fetchEmergencyServices(lat, lng, radius, [
    'park',
    'library',
    'school',
    'community_center',
  ]);
}

export async function fetchAllEmergencyServices(
  lat: number,
  lng: number,
  radius: number = 16093
): Promise<GooglePlaceResult[]> {
  return fetchEmergencyServices(lat, lng, radius, [
    'hospital',
    'police',
    'fire_station',
    'pharmacy',
    'doctor',
    'local_government_office',
    'park',
    'library',
  ]);
}

/**
 * Get the distance between two coordinates in meters
 * Uses Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else if (meters < 10000) {
    return `${(meters / 1000).toFixed(1)}km`;
  } else {
    return `${Math.round(meters / 1000)}km`;
  }
}

/**
 * Estimate travel time based on distance and mode
 */
export function estimateTravelTime(
  distanceMeters: number,
  mode: 'driving' | 'walking' | 'biking' = 'driving'
): string {
  // Average speeds
  const speeds = {
    driving: 50 * 1000 / 60, // 50 km/h in meters/minute
    walking: 5 * 1000 / 60,  // 5 km/h in meters/minute
    biking: 15 * 1000 / 60,  // 15 km/h in meters/minute
  };

  const minutes = Math.round(distanceMeters / speeds[mode]);

  if (minutes < 60) {
    return `${minutes} minutes`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${hours}h ${remainingMinutes}min`;
  }
}
