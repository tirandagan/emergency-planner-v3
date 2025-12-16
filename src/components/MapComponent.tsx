"use client";

import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, DirectionsRenderer } from '@react-google-maps/api';
import { Route } from '@/types';
import { Loader2 } from 'lucide-react';
import { GOOGLE_MAPS_LIBRARIES } from '@/lib/googleMaps';

interface MapComponentProps {
    routes: Route[];
    center?: [number, number];
    activeRouteIndices?: number[];
}

const containerStyle = {
    width: '100%',
    height: '100%'
};

const MapComponent: React.FC<MapComponentProps> = ({ routes, center, activeRouteIndices = [] }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY || "",
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    const [directionsMap, setDirectionsMap] = useState<Record<number, google.maps.DirectionsResult>>({});
    const [selectedMarker, setSelectedMarker] = useState<{ lat: number; lng: number; name: string; routeName: string; type: string } | null>(null);
    const processedRoutes = useRef<Set<number>>(new Set());

    // Default center if none provided (e.g., center of US)
    const defaultCenter = { lat: 39.8283, lng: -98.5795 };

    // Calculate center from routes
    const mapCenter = center
        ? { lat: center[0], lng: center[1] }
        : (routes && routes.length > 0 && routes[0].waypoints && routes[0].waypoints.length > 0
            ? { lat: routes[0].waypoints[0].lat, lng: routes[0].waypoints[0].lng }
            : defaultCenter);

    const [map, setMap] = useState<google.maps.Map | null>(null);

    useEffect(() => {
        if (!map || !window.google || activeRouteIndices.length === 0) return;

        const bounds = new window.google.maps.LatLngBounds();
        let hasValidBounds = false;

        // If specific routes are active, center on them
        activeRouteIndices.forEach(index => {
            const directionResult = directionsMap[index];
            if (directionResult && directionResult.routes[0] && directionResult.routes[0].bounds) {
                bounds.union(directionResult.routes[0].bounds);
                hasValidBounds = true;
            }
        });

        if (hasValidBounds) {
            map.fitBounds(bounds);
        }
    }, [map, activeRouteIndices, directionsMap]);

    useEffect(() => {
        if (!isLoaded || !window.google || routes.length === 0) return;

        const service = new window.google.maps.DirectionsService();

        routes.forEach((route, index) => {
            // Avoid reprocessing if we already have it (unless routes changed completely, relying on parent to remount or clear)
            // For simplicity in this effect, we just check if it's in state
            if (directionsMap[index]) return;

            if (!route.waypoints || route.waypoints.length < 2) return;

            const origin = route.waypoints[0];
            const destination = route.waypoints[route.waypoints.length - 1];

            // Middle waypoints
            const waypoints = route.waypoints.slice(1, -1).map(wp => ({
                location: { lat: wp.lat, lng: wp.lng },
                stopover: true
            }));

            // Check if route type indicates walking (case-insensitive, handles "foot", "Foot Path", "walking", etc.)
            const isWalking = route.type?.toLowerCase().includes('foot') || route.type?.toLowerCase().includes('walk');

            service.route({
                origin: { lat: origin.lat, lng: origin.lng },
                destination: { lat: destination.lat, lng: destination.lng },
                waypoints: waypoints,
                travelMode: isWalking ? google.maps.TravelMode.WALKING : google.maps.TravelMode.DRIVING,
            }, (result, status) => {
                if (status === 'OK' && result) {
                    setDirectionsMap(prev => ({ ...prev, [index]: result }));
                } else {
                    console.error(`Directions request failed for route ${index}: ${status}`);
                }
            });
        });
    }, [isLoaded, routes, directionsMap]);

    if (!isLoaded) {
        return (
            <div className="h-[400px] w-full rounded-xl border border-gray-700 bg-gray-800 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Loading Navigation Systems...</p>
                {!process.env.NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY && (
                    <p className="text-red-400 text-xs mt-2">Missing API Key</p>
                )}
            </div>
        );
    }

    return (
        <div className="h-[400px] w-full rounded-xl overflow-hidden border border-gray-700 z-0 relative">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={mapCenter}
                zoom={10}
                onLoad={setMap}
                options={{
                    styles: [
                        { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                        {
                            featureType: "administrative.locality",
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#d59563" }],
                        },
                        {
                            featureType: "road",
                            elementType: "geometry",
                            stylers: [{ color: "#38414e" }],
                        },
                        {
                            featureType: "road",
                            elementType: "geometry.stroke",
                            stylers: [{ color: "#212a37" }],
                        },
                        {
                            featureType: "road",
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#9ca5b3" }],
                        },
                        {
                            featureType: "road.highway",
                            elementType: "geometry",
                            stylers: [{ color: "#746855" }],
                        },
                        {
                            featureType: "road.highway",
                            elementType: "geometry.stroke",
                            stylers: [{ color: "#1f2835" }],
                        },
                        {
                            featureType: "road.highway",
                            elementType: "labels.text.fill",
                            stylers: [{ color: "#f3d19c" }],
                        },
                        {
                            featureType: "administrative.province",
                            elementType: "geometry.stroke",
                            stylers: [{ color: "#ffffff" }, { weight: 2 }]
                        }
                    ]
                }}
            >
                {(routes || []).map((route, index) => {
                    if (!route) return null;
                    const directions = directionsMap[index];

                    // Distinct colors for each route
                    const routeColors = ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6'];
                    const routeColor = routeColors[index % routeColors.length];

                    // Only render if we have directions (no straight line fallback)
                    if (!directions) return null;

                    // Determine highlighting
                    const isHighlighted = activeRouteIndices.length === 0 || activeRouteIndices.includes(index);
                    const opacity = isHighlighted ? 0.9 : 0.2;
                    const weight = isHighlighted ? 6 : 4;
                    const zIndex = isHighlighted ? 100 : 50 - index;

                    return (
                        <React.Fragment key={route.id || index}>
                            {/* Render Actual Route */}
                            <DirectionsRenderer
                                directions={directions}
                                options={{
                                    suppressMarkers: true,
                                    polylineOptions: {
                                        strokeColor: routeColor,
                                        strokeOpacity: opacity,
                                        strokeWeight: weight,
                                        zIndex: zIndex
                                    }
                                }}
                            />

                            {/* Custom Markers */}
                            {(route.waypoints || []).map((wp, wpIdx) => {
                                const isStart = wpIdx === 0;
                                const isEnd = wpIdx === (route.waypoints?.length || 0) - 1;

                                // Only show Start and End markers
                                if (!isStart && !isEnd) return null;

                                return (
                                    <Marker
                                        key={`${route.id || index}-${wpIdx}`}
                                        position={{ lat: wp.lat, lng: wp.lng }}
                                        label={isEnd ? {
                                            text: `${index + 1}`,
                                            color: "white",
                                            fontWeight: "bold"
                                        } : undefined}
                                        icon={isStart ? {
                                            path: google.maps.SymbolPath.CIRCLE,
                                            scale: 8,
                                            fillColor: routeColor,
                                            fillOpacity: 1,
                                            strokeColor: "white",
                                            strokeWeight: 2,
                                        } : undefined}
                                        onClick={() => setSelectedMarker({
                                            lat: wp.lat,
                                            lng: wp.lng,
                                            name: wp.name,
                                            routeName: route.name,
                                            type: isStart ? 'Start' : 'Destination'
                                        })}
                                    />
                                );
                            })}
                        </React.Fragment>
                    );
                })}

                {selectedMarker && (
                    <InfoWindow
                        position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                        onCloseClick={() => setSelectedMarker(null)}
                    >
                        <div className="text-black p-1">
                            <strong className="block text-sm">{selectedMarker.name}</strong>
                            <span className="text-xs text-gray-600">
                                {selectedMarker.routeName} ({selectedMarker.type})
                            </span>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </div>
    );
};

export default MapComponent;
