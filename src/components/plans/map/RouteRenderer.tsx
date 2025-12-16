'use client';

import React, { useEffect, useState } from 'react';
import { Polyline } from '@react-google-maps/api';
import { computeRouteWithWaypoints, geocodeWaypoints } from '@/lib/google-routes';
import type { EvacuationRoute } from '@/types/mission-report';

interface RouteRendererProps {
  route: EvacuationRoute;
  color: string;
  isSelected: boolean;
  onRouteClick: () => void;
}

export function RouteRenderer({ route, color, isSelected, onRouteClick }: RouteRendererProps) {
  const [computedPath, setComputedPath] = useState<{ lat: number; lng: number }[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRoute() {
      if (!route.waypoints || route.waypoints.length < 2) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setGeocodingError(null);

      try {
        // STEP 1: Geocode waypoints first
        const geocodedWaypoints = await geocodeWaypoints(route.waypoints);

        // STEP 2: Compute route using geocoded waypoints
        const computed = await computeRouteWithWaypoints(geocodedWaypoints);

        if (computed) {
          setComputedPath(computed.polyline);
        } else {
          // Fallback to simple polyline with geocoded coordinates
          const fallbackPath = geocodedWaypoints.map((wp) => ({
            lat: wp.lat,
            lng: wp.lng,
          }));
          setComputedPath(fallbackPath);
        }
      } catch (error) {
        console.error('Route rendering error:', error);
        setGeocodingError(error instanceof Error ? error.message : 'Failed to load route');
      }

      setIsLoading(false);
    }

    loadRoute();
  }, [route.waypoints]);

  if (geocodingError) {
    console.error('Geocoding error:', geocodingError);
    return null;
  }

  if (isLoading || !computedPath) {
    return null;
  }

  return (
    <Polyline
      path={computedPath}
      options={{
        strokeColor: color,
        strokeOpacity: isSelected ? 0.9 : 0.3,
        strokeWeight: isSelected ? 6 : 4,
        zIndex: isSelected ? 100 : 10,
      }}
      onClick={onRouteClick}
    />
  );
}
