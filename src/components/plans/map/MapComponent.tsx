'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Polyline, Marker } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
import { RouteRenderer } from './RouteRenderer';
import type { EvacuationRoute } from '@/types/mission-report';
import type { LocationData } from '@/types/wizard';

const libraries: ('places' | 'drawing' | 'geometry' | 'visualization')[] = ['places'];

// Route colors matching v1 (amber, green, blue, red, purple)
const ROUTE_COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6'];

// Dark tactical map theme from v1
const darkMapStyles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

interface MapComponentProps {
  routes: EvacuationRoute[];
  location: LocationData;
  onRouteSelect?: (index: number) => void;
  selectedRouteIndex?: number | null;
  shouldAutoZoom?: boolean;
  isPanelMinimized?: boolean;
}

export function MapComponent({
  routes,
  location,
  onRouteSelect,
  selectedRouteIndex = 0,
  shouldAutoZoom = false,
  isPanelMinimized = false,
}: MapComponentProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY || '',
    libraries,
  });

  const mapRef = useRef<google.maps.Map | null>(null);
  const isInitialLoadRef = useRef(true);

  const handleRouteClick = useCallback(
    (index: number) => {
      onRouteSelect?.(index);
    },
    [onRouteSelect]
  );

  // Helper: Calculate bounds for a specific route
  const getRouteBounds = useCallback((route: EvacuationRoute): google.maps.LatLngBounds | null => {
    if (!window.google?.maps) return null;

    const bounds = new window.google.maps.LatLngBounds();
    let hasValidPoints = false;

    // Add all waypoints with coordinates to bounds
    route.waypoints?.forEach(wp => {
      if (wp.lat !== undefined && wp.lng !== undefined) {
        bounds.extend({ lat: wp.lat, lng: wp.lng });
        hasValidPoints = true;
      }
    });

    return hasValidPoints ? bounds : null;
  }, []);

  // Helper: Fit bounds with panel offset compensation
  const fitBoundsWithOffset = useCallback((bounds: google.maps.LatLngBounds, panelWidth: number): void => {
    if (!mapRef.current) return;

    // First fit the bounds with padding
    const padding = { top: 50, right: 50, bottom: 50, left: panelWidth + 50 };
    mapRef.current.fitBounds(bounds, padding);

    // Additional pan to ensure route is centered in visible area
    // Shift left by quarter panel width to better center content
    if (panelWidth > 0) {
      setTimeout(() => {
        mapRef.current?.panBy(-panelWidth / 4, 0);
      }, 100);
    }
  }, []);

  // Helper: Get panel width based on screen size and state
  const getPanelWidth = useCallback((): number => {
    // Mobile: no offset (sheet is overlay)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return 0;
    }

    // Desktop minimized: just the tab width
    if (isPanelMinimized) {
      return 48;
    }

    // Desktop expanded: fixed panel width
    return 340;
  }, [isPanelMinimized]);

  // Auto-zoom when route selection changes (only from panel clicks)
  useEffect(() => {
    // Mark initial load as complete once map is loaded
    if (isInitialLoadRef.current && isLoaded) {
      isInitialLoadRef.current = false;
    }

    // Don't zoom on initial load or when auto-zoom is disabled
    if (isInitialLoadRef.current || !shouldAutoZoom) {
      return;
    }

    // Don't zoom if no route is selected
    if (selectedRouteIndex === null || selectedRouteIndex === undefined) return;

    const selectedRoute = routes[selectedRouteIndex];
    if (!selectedRoute) return;

    const bounds = getRouteBounds(selectedRoute);
    if (!bounds) return;

    const panelWidth = getPanelWidth();

    // Add delay for smooth transition
    setTimeout(() => {
      fitBoundsWithOffset(bounds, panelWidth);
    }, 150);
  }, [selectedRouteIndex, shouldAutoZoom, routes, isLoaded, getRouteBounds, fitBoundsWithOffset, getPanelWidth]);

  // Callback when map loads
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <p className="text-slate-900 dark:text-slate-100 font-medium">
            Failed to load Google Maps
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Please check your API key configuration
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-[600px] bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-slate-600 dark:text-slate-400" />
          <p className="text-sm text-slate-600 dark:text-slate-400">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={{ width: '100%', height: '100%' }}
      center={{ lat: location.coordinates.lat, lng: location.coordinates.lng }}
      zoom={10}
      options={{
        styles: darkMapStyles,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
      }}
      onLoad={onMapLoad}
    >
      {/* Render routes - use Routes API for vehicles, Polyline for on-foot */}
      {routes.map((route, index) => {
        if (!route.waypoints || route.waypoints.length < 2) return null;

        const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
        const isSelected = index === selectedRouteIndex;

        // For vehicle routes, use computed route from Routes API
        if (route.mode === 'vehicle') {
          return (
            <RouteRenderer
              key={`route-${index}`}
              route={route}
              color={color}
              isSelected={isSelected}
              onRouteClick={() => handleRouteClick(index)}
            />
          );
        }

        // For on-foot routes, continue using simple Polyline
        // Only include waypoints with coordinates (geocoded)
        const path = route.waypoints
          .filter((wp) => wp.lat !== undefined && wp.lng !== undefined)
          .map((wp) => ({
            lat: wp.lat!,
            lng: wp.lng!,
          }));

        // Don't render if no valid waypoints
        if (path.length < 2) return null;

        return (
          <Polyline
            key={`route-${index}`}
            path={path}
            options={{
              strokeColor: color,
              strokeOpacity: isSelected ? 0.9 : 0.3,
              strokeWeight: isSelected ? 6 : 4,
              zIndex: isSelected ? 100 : 10 + index,
            }}
          />
        );
      })}

      {/* Custom markers for start, end, and waypoints */}
      {routes.map((route, index) => {
        if (!route.waypoints || route.waypoints.length < 2) return null;

        const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
        const start = route.waypoints[0];
        const end = route.waypoints[route.waypoints.length - 1];
        const intermediateWaypoints = route.waypoints.slice(1, -1);

        // Only render markers if waypoints have been geocoded
        const hasCoordinates =
          start.lat !== undefined &&
          start.lng !== undefined &&
          end.lat !== undefined &&
          end.lng !== undefined;

        if (!hasCoordinates) {
          return null; // Skip rendering markers for routes without coordinates
        }

        return (
          <React.Fragment key={`markers-${index}`}>
            {/* Start marker with route number + B */}
            <Marker
              position={{ lat: start.lat!, lng: start.lng! }}
              label={{
                text: `${index + 1}B`,
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 2,
              }}
              onClick={() => handleRouteClick(index)}
            />

            {/* Intermediate waypoint markers with letters - only geocoded ones */}
            {intermediateWaypoints
              .filter((wp) => wp.lat !== undefined && wp.lng !== undefined)
              .map((waypoint, wpIndex) => (
                <Marker
                  key={`waypoint-${index}-${wpIndex}`}
                  position={{ lat: waypoint.lat!, lng: waypoint.lng! }}
                label={{
                  text: String.fromCharCode(97 + wpIndex), // a, b, c, ...
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '12px',
                }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: color,
                  fillOpacity: 0.8,
                  strokeColor: 'white',
                  strokeWeight: 2,
                }}
                title={waypoint.name}
                onClick={() => handleRouteClick(index)}
              />
            ))}

            {/* End marker with route number + E */}
            <Marker
              position={{ lat: end.lat!, lng: end.lng! }}
              label={{
                text: `${index + 1}E`,
                color: 'white',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: 'white',
                strokeWeight: 2,
              }}
              onClick={() => handleRouteClick(index)}
            />
          </React.Fragment>
        );
      })}
    </GoogleMap>
  );
}
