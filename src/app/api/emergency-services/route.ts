import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/db';
import { googlePlacesCache } from '@/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { GooglePlaceResult } from '@/types/emergency-contacts';

/**
 * Emergency Services API Route
 * Fetches local emergency services via Google Places NearbySearch API with database caching
 *
 * Query params:
 * - lat: Latitude (-90 to 90)
 * - lng: Longitude (-180 to 180)
 * - radius: Search radius in meters (default: 16093 = 10 miles)
 * - types: Comma-separated place types (e.g., "hospital,police,fire_station")
 *
 * Returns:
 * - services: Array of GooglePlaceResult objects
 * - cached: Boolean indicating if results were from cache
 * - cacheAge: Age of cache in minutes (if cached)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const radiusStr = searchParams.get('radius');
    const typesStr = searchParams.get('types');

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: 'Missing required parameters: lat, lng' },
        { status: 400 }
      );
    }

    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    const radius = radiusStr ? parseInt(radiusStr, 10) : 16093; // 10 miles default
    const types = typesStr ? typesStr.split(',').map(t => t.trim()) : [];

    // Validate coordinates
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return NextResponse.json(
        { error: 'Invalid latitude - must be between -90 and 90' },
        { status: 400 }
      );
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      return NextResponse.json(
        { error: 'Invalid longitude - must be between -180 and 180' },
        { status: 400 }
      );
    }

    if (isNaN(radius) || radius < 0 || radius > 50000) {
      return NextResponse.json(
        { error: 'Invalid radius - must be between 0 and 50000 meters' },
        { status: 400 }
      );
    }

    // Validate place types (whitelist for security)
    const allowedTypes = [
      'hospital',
      'police',
      'fire_station',
      'pharmacy',
      'doctor',
      'local_government_office',
      'park',
      'library',
      'school',
      'community_center',
    ];

    const invalidTypes = types.filter(t => !allowedTypes.includes(t));
    if (invalidTypes.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid place types: ${invalidTypes.join(', ')}`,
          allowedTypes
        },
        { status: 400 }
      );
    }

    // Generate cache key (round coordinates to 0.1 degree for ~7 mile clustering)
    const roundedLat = Math.round(lat * 10) / 10;
    const roundedLng = Math.round(lng * 10) / 10;
    const sortedTypes = [...types].sort().join(',');
    const cacheKey = `places:${roundedLat}:${roundedLng}:${radius}:${sortedTypes}`;

    // Check cache first
    const cachedResults = await db
      .select()
      .from(googlePlacesCache)
      .where(
        and(
          eq(googlePlacesCache.cacheKey, cacheKey),
          gt(googlePlacesCache.expiresAt, new Date())
        )
      )
      .limit(1);

    if (cachedResults.length > 0) {
      const cached = cachedResults[0];
      const cacheAgeMinutes = Math.floor(
        (Date.now() - new Date(cached.cachedAt).getTime()) / 1000 / 60
      );

      // Increment hit count
      await db
        .update(googlePlacesCache)
        .set({ hitCount: cached.hitCount + 1 })
        .where(eq(googlePlacesCache.id, cached.id));

      console.log(`✅ Cache HIT for ${cacheKey} (${cacheAgeMinutes}min old, ${cached.hitCount + 1} hits)`);

      return NextResponse.json({
        services: cached.placeResults as GooglePlaceResult[],
        cached: true,
        cacheAge: cacheAgeMinutes,
      });
    }

    console.log(`❌ Cache MISS for ${cacheKey} - fetching from Google Places API`);

    // Fetch from Google Places API
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY;
    if (!googleApiKey) {
      console.error('NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY not configured');
      return NextResponse.json(
        { error: 'Google Places API not configured' },
        { status: 500 }
      );
    }

    const placesUrl = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    placesUrl.searchParams.set('location', `${lat},${lng}`);
    placesUrl.searchParams.set('radius', radius.toString());
    if (types.length > 0) {
      placesUrl.searchParams.set('type', types.join('|'));
    }
    placesUrl.searchParams.set('key', googleApiKey);

    const response = await fetch(placesUrl.toString());

    if (!response.ok) {
      console.error('Google Places API error:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch from Google Places API', services: [] },
        { status: 500 }
      );
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message);
      return NextResponse.json(
        {
          error: `Google Places API error: ${data.status}`,
          message: data.error_message,
          services: []
        },
        { status: 500 }
      );
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

    // Save to cache
    try {
      await db.insert(googlePlacesCache).values({
        cacheKey,
        placeResults: services as any, // JSONB type
        cachedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        hitCount: 1,
      });
      console.log(`💾 Cached ${services.length} results for ${cacheKey}`);
    } catch (cacheError) {
      console.error('Failed to cache results:', cacheError);
      // Don't throw - continue even if caching fails
    }

    return NextResponse.json({
      services,
      cached: false,
      cacheAge: 0,
    });

  } catch (error) {
    console.error('Emergency services API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        services: []
      },
      { status: 500 }
    );
  }
}
