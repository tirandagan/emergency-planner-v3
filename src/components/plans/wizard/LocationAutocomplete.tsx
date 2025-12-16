"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { MapPin, Loader2, AlertTriangle, Info, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { GOOGLE_MAPS_LIBRARIES } from '@/lib/googleMaps';
import { detectClimateZone } from '@/lib/climate';
import type { LocationData } from '@/types/wizard';

interface LocationAutocompleteProps {
  onLocationSelect: (locationData: LocationData) => void;
  value?: string;
  error?: string;
}

/**
 * User-friendly error messages for Google Maps API errors
 */
const GOOGLE_ERROR_MESSAGES: Record<string, { message: string; hint: string }> = {
  RefererNotAllowedMapError: {
    message: 'Location services are temporarily unavailable.',
    hint: 'You can still enter your location manually below.',
  },
  ApiNotActivatedMapError: {
    message: 'Location autocomplete is not available.',
    hint: 'Please type your city and state manually.',
  },
  InvalidKeyMapError: {
    message: 'Location services are temporarily unavailable.',
    hint: 'Our team has been notified. Please enter your location manually.',
  },
  OverQueryLimitMapError: {
    message: 'Location services are busy.',
    hint: 'Please try again in a moment or enter your location manually.',
  },
  RequestDeniedMapError: {
    message: 'Location request was denied.',
    hint: 'Please enter your location manually.',
  },
  MissingKeyMapError: {
    message: 'Location services are not configured.',
    hint: 'Please enter your location manually.',
  },
};

/**
 * Log error to server for admin review
 */
async function logClientError(
  errorName: string,
  errorMessage: string,
  metadata?: Record<string, unknown>
) {
  try {
    await fetch('/api/system-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: errorMessage,
        errorName,
        errorCode: errorName,
        severity: 'error',
        category: 'external_service',
        component: 'LocationAutocomplete',
        route: window.location.pathname,
        userAction: 'Setting up mission plan location',
        metadata: {
          ...metadata,
          url: window.location.href,
        },
      }),
    });
  } catch (e) {
    // Don't throw on logging failure
    console.error('[LocationAutocomplete] Failed to log error:', e);
  }
}

/**
 * Wizard-specific Location Autocomplete Component
 * Integrates Google Places API with climate zone detection
 * Features graceful error handling with manual fallback
 */
export function LocationAutocomplete({
  onLocationSelect,
  value = '',
  error,
}: LocationAutocompleteProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  const autocompleteContainerRef = useRef<HTMLDivElement>(null);
  const placeAutocompleteRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const [address, setAddress] = useState(value);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [apiError, setApiError] = useState<{ message: string; hint: string } | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCity, setManualCity] = useState('');
  const [manualState, setManualState] = useState('');
  const [manualCountry, setManualCountry] = useState('United States');
  const hasLoggedError = useRef(false);

  /**
   * Handle Google Maps API errors
   */
  const handleApiError = useCallback((errorName: string, originalError?: Error) => {
    const errorInfo = GOOGLE_ERROR_MESSAGES[errorName] || {
      message: 'Location services are temporarily unavailable.',
      hint: 'Our team has been notified. Please enter your location manually.',
    };

    setApiError(errorInfo);
    setShowManualEntry(true);

    // Log error to server (only once per session)
    if (!hasLoggedError.current) {
      hasLoggedError.current = true;
      logClientError(errorName, originalError?.message || errorName, {
        detectedError: errorName,
        hasApiKey: !!process.env.NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY,
        referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      });
    }

    // Console error for developers
    console.error(
      `[LocationAutocomplete] Google Maps API Error: ${errorName}\n` +
      `Resolution: Check Google Cloud Console > APIs & Services > Credentials\n` +
      `Ensure the API key has proper domain restrictions for: ${typeof window !== 'undefined' ? window.location.origin : 'unknown'}`
    );
  }, []);

  /**
   * Monitor for Google Maps API errors via window events
   */
  useEffect(() => {
    const handleGoogleError = (event: ErrorEvent) => {
      const errorMatch = event.message?.match(
        /(RefererNotAllowedMapError|ApiNotActivatedMapError|InvalidKeyMapError|OverQueryLimitMapError|RequestDeniedMapError|MissingKeyMapError)/
      );
      if (errorMatch) {
        handleApiError(errorMatch[1], new Error(event.message));
      }
    };

    window.addEventListener('error', handleGoogleError);
    return () => window.removeEventListener('error', handleGoogleError);
  }, [handleApiError]);

  /**
   * Handle load error from useJsApiLoader
   */
  useEffect(() => {
    if (loadError) {
      const errorName = loadError.message?.match(
        /(RefererNotAllowedMapError|ApiNotActivatedMapError|InvalidKeyMapError|OverQueryLimitMapError|RequestDeniedMapError|MissingKeyMapError)/
      )?.[1] || 'LoadError';
      handleApiError(errorName, loadError);
    }
  }, [loadError, handleApiError]);

  /**
   * Initialize PlaceAutocompleteElement when Maps API is loaded
   */
  useEffect(() => {
    if (!isLoaded || !autocompleteContainerRef.current || apiError || showManualEntry) {
      return;
    }

    const initAutocomplete = async () => {
      try {
        // Double-check container is still available
        if (!autocompleteContainerRef.current) return;

        // Import the places library
        await google.maps.importLibrary('places');

        // Create PlaceAutocompleteElement
        // @ts-ignore - PlaceAutocompleteElement types may not be up to date
        const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
          // Restrict to geocode results (cities, addresses)
          componentRestrictions: undefined,
        });

        placeAutocompleteRef.current = placeAutocomplete;

        // Add event listener for place selection (gmp-select is the new event name)
        // @ts-ignore - Event types may not be up to date
        placeAutocomplete.addEventListener('gmp-select', async (event: any) => {
          try {
            // Get the place prediction and convert to Place object
            const place = event.placePrediction?.toPlace();
            if (!place) return;

            // Fetch place details with the new API
            await place.fetchFields({
              fields: ['addressComponents', 'formattedAddress', 'location', 'id'],
            });

            // Convert to our LocationData format
            const locationData = extractLocationDataFromPlace(place);
            onLocationSelect(locationData);
            setAddress(place.formattedAddress || '');
            setApiError(null);
          } catch (err) {
            console.error('[LocationAutocomplete] Error handling place selection:', err);
          }
        });

        // Append to container (recheck it's still available)
        if (autocompleteContainerRef.current) {
          autocompleteContainerRef.current.appendChild(placeAutocomplete);
        }
      } catch (err) {
        console.error('[LocationAutocomplete] Error initializing PlaceAutocompleteElement:', err);
        handleApiError('InitializationError', err as Error);
      }
    };

    initAutocomplete();

    // Cleanup
    return () => {
      if (placeAutocompleteRef.current && autocompleteContainerRef.current) {
        try {
          autocompleteContainerRef.current.removeChild(placeAutocompleteRef.current);
        } catch (e) {
          // Element may already be removed
        }
        placeAutocompleteRef.current = null;
      }
    };
  }, [isLoaded, apiError, showManualEntry, onLocationSelect]);

  /**
   * Extract location data from the new Place class
   */
  const extractLocationDataFromPlace = (place: any): LocationData => {
    // @ts-ignore - addressComponents may not be typed correctly
    const addressComponents = place.addressComponents || [];

    const getComponent = (type: string) =>
      addressComponents.find((c: any) => c.types.includes(type))?.longText || '';

    const city =
      getComponent('locality') ||
      getComponent('sublocality') ||
      getComponent('administrative_area_level_2');
    const state = getComponent('administrative_area_level_1');
    const country = getComponent('country');

    // Get coordinates from the new location property
    // Note: Google Maps Place API returns lat/lng as methods, not properties
    // @ts-ignore - location types may not be correct
    const lat = typeof place.location?.lat === 'function'
      ? place.location.lat()
      : place.location?.lat ?? 0;
    // @ts-ignore
    const lng = typeof place.location?.lng === 'function'
      ? place.location.lng()
      : place.location?.lng ?? 0;

    const climateZone = detectClimateZone(lat);

    return {
      city,
      state,
      country,
      coordinates: { lat, lng },
      climateZone,
      // @ts-ignore
      fullAddress: place.formattedAddress || '',
      // @ts-ignore
      placeId: place.id || '',
    };
  };

  /**
   * Extract location data from Google Places result (legacy for reverse geocoding)
   */
  const extractLocationData = (
    place: google.maps.places.PlaceResult | google.maps.GeocoderResult
  ): LocationData => {
    const addressComponents = place.address_components || [];

    const getComponent = (type: string) =>
      addressComponents.find((c) => c.types.includes(type))?.long_name || '';

    // Extract location components
    const city =
      getComponent('locality') ||
      getComponent('sublocality') ||
      getComponent('administrative_area_level_2');
    const state = getComponent('administrative_area_level_1');
    const country = getComponent('country');

    // Get coordinates
    let lat = 0;
    let lng = 0;
    if ('geometry' in place && place.geometry?.location) {
      if (typeof place.geometry.location.lat === 'function') {
        lat = place.geometry.location.lat();
        lng = place.geometry.location.lng();
      } else {
        lat = place.geometry.location.lat();
        lng = place.geometry.location.lng();
      }
    }

    // Detect climate zone from latitude
    const climateZone = detectClimateZone(lat);

    return {
      city,
      state,
      country,
      coordinates: { lat, lng },
      climateZone,
      fullAddress: 'formatted_address' in place ? place.formatted_address || '' : '',
      placeId: place.place_id || '',
      rawPlaceData: 'geometry' in place ? place : undefined,
    };
  };


  /**
   * Handle manual location entry
   */
  const handleManualEntry = () => {
    if (!manualCity.trim()) {
      return;
    }

    // Create location data from manual entry
    // Use approximate coordinates based on common US cities (will be refined later)
    const locationData: LocationData = {
      city: manualCity.trim(),
      state: manualState.trim(),
      country: manualCountry.trim(),
      coordinates: { lat: 39.8283, lng: -98.5795 }, // Center of US as default
      climateZone: 'temperate', // Default, can be refined
      fullAddress: `${manualCity}${manualState ? `, ${manualState}` : ''}${manualCountry ? `, ${manualCountry}` : ''}`,
      placeId: '',
    };

    onLocationSelect(locationData);
    setAddress(locationData.fullAddress);
    setAutocompleteValue(locationData.fullAddress);
    // Switch back to autocomplete view with populated address
    setShowManualEntry(false);
    setApiError(null);
  };

  /**
   * Set the value of the PlaceAutocompleteElement's internal input field
   */
  const setAutocompleteValue = (value: string) => {
    if (!placeAutocompleteRef.current) return;

    // Helper to set the value
    const setValue = () => {
      try {
        // PlaceAutocompleteElement uses Shadow DOM, need to access shadowRoot
        // @ts-ignore - shadowRoot might not be typed
        const shadowRoot = placeAutocompleteRef.current?.shadowRoot;
        if (shadowRoot) {
          const inputElement = shadowRoot.querySelector('input');
          if (inputElement) {
            inputElement.value = value;
            // Trigger input event so any listeners are notified
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('[LocationAutocomplete] Successfully set autocomplete value:', value);
            return true;
          }
        } else {
          // Fallback: try direct querySelector (in case shadow DOM is not used)
          const inputElement = placeAutocompleteRef.current?.querySelector('input');
          if (inputElement) {
            inputElement.value = value;
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('[LocationAutocomplete] Successfully set autocomplete value (no shadow):', value);
            return true;
          }
        }
        return false;
      } catch (err) {
        console.error('[LocationAutocomplete] Error setting autocomplete value:', err);
        return false;
      }
    };

    // Try immediately
    if (setValue()) return;

    // If failed, try again after a short delay to ensure element is fully initialized
    setTimeout(() => {
      if (!setValue()) {
        console.warn('[LocationAutocomplete] Failed to set autocomplete value after retry');
      }
    }, 100);
  };

  /**
   * Handle "Use Current Location" button click
   */
  const handleUseCurrentLocation = () => {
    if (!('geolocation' in navigator)) {
      setApiError({
        message: 'Geolocation is not supported by your browser.',
        hint: 'Please enter your location manually.',
      });
      setShowManualEntry(true);
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // If Google Maps is not available, use coordinates directly
        if (!isLoaded || apiError) {
          const locationData: LocationData = {
            city: '',
            state: '',
            country: '',
            coordinates: { lat: latitude, lng: longitude },
            climateZone: detectClimateZone(latitude),
            fullAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            placeId: '',
          };
          onLocationSelect(locationData);
          setAddress(locationData.fullAddress);
          setAutocompleteValue(locationData.fullAddress);
          setIsGettingLocation(false);
          return;
        }

        try {
          // Reverse geocode to get address
          const geocoder = new google.maps.Geocoder();
          const result = await geocoder.geocode({
            location: { lat: latitude, lng: longitude },
          });

          if (result.results[0]) {
            const locationData = extractLocationData(result.results[0]);
            const formattedAddress = result.results[0].formatted_address;

            onLocationSelect(locationData);
            setAddress(formattedAddress);
            setAutocompleteValue(formattedAddress);
            setApiError(null);
          }
        } catch (geocodeError) {
          console.error('Geocoding error:', geocodeError);
          // Fallback to coordinates
          const locationData: LocationData = {
            city: '',
            state: '',
            country: '',
            coordinates: { lat: latitude, lng: longitude },
            climateZone: detectClimateZone(latitude),
            fullAddress: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            placeId: '',
          };
          onLocationSelect(locationData);
          setAddress(locationData.fullAddress);
          setAutocompleteValue(locationData.fullAddress);
        } finally {
          setIsGettingLocation(false);
        }
      },
      (geoError) => {
        console.error('Geolocation error:', geoError);
        setIsGettingLocation(false);

        let errorMessage = 'Failed to get your location.';
        let hint = 'Please enter your location manually.';

        if (geoError.code === geoError.PERMISSION_DENIED) {
          errorMessage = 'Location access was denied.';
          hint = 'Please enable location permissions or enter your location manually.';
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          errorMessage = 'Location information is unavailable.';
        } else if (geoError.code === geoError.TIMEOUT) {
          errorMessage = 'Location request timed out.';
          hint = 'Please try again or enter your location manually.';
        }

        setApiError({ message: errorMessage, hint });
        setShowManualEntry(true);
      },
      {
        enableHighAccuracy: false, // Faster response, less accuracy needed for city-level
        timeout: 30000, // 30 seconds - give browser time to prompt user
        maximumAge: 60000, // Allow cached position up to 1 minute old
      }
    );
  };

  // Show manual entry mode if there's an API error
  if (apiError || showManualEntry) {
    return (
      <div className="space-y-4">
        {apiError && (
          <Alert variant="destructive" className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <span className="font-medium">{apiError.message}</span>
              <br />
              <span className="text-sm">{apiError.hint}</span>
              <br />
              <span className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 block">
                Our team has been notified and is working on it.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Manual Entry Form */}
        <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Info className="w-4 h-4" />
            Enter your location manually
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="manual-city" className="text-xs text-muted-foreground mb-1 block">
                City *
              </label>
              <Input
                id="manual-city"
                value={manualCity}
                onChange={(e) => setManualCity(e.target.value)}
                placeholder="Enter your city"
                className={!manualCity.trim() && error ? 'border-destructive' : ''}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label htmlFor="manual-state" className="text-xs text-muted-foreground mb-1 block">
                State/Region
              </label>
              <Input
                id="manual-state"
                value={manualState}
                onChange={(e) => setManualState(e.target.value)}
                placeholder="State or region"
              />
            </div>
          </div>

          <div>
            <label htmlFor="manual-country" className="text-xs text-muted-foreground mb-1 block">
              Country
            </label>
            <Input
              id="manual-country"
              value={manualCountry}
              onChange={(e) => setManualCountry(e.target.value)}
              placeholder="Country"
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleManualEntry}
              disabled={!manualCity.trim()}
              className="flex-1"
            >
              Use This Location
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleUseCurrentLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Show selected address if any */}
        {address && (
          <p className="text-sm text-muted-foreground">
            Selected: <span className="font-medium text-foreground">{address}</span>
          </p>
        )}
      </div>
    );
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading location search...</span>
      </div>
    );
  }

  // Normal autocomplete mode
  return (
    <div className="space-y-2">
      {/* Show selected location if one exists */}
      {address ? (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <MapPin className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-900 dark:text-green-100 truncate">
              {address}
            </p>
            <p className="text-xs text-green-700 dark:text-green-300">
              Location selected
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setAddress('');
              onLocationSelect({
                city: '',
                state: '',
                country: '',
                coordinates: { lat: 0, lng: 0 },
                climateZone: '',
                fullAddress: '',
                placeId: '',
              });
            }}
            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 transition-colors"
            aria-label="Clear location"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="flex-1">
            {/* PlaceAutocompleteElement container - element will be appended here by useEffect */}
            {/* The web component manages its own input field and value */}
            <div
              ref={autocompleteContainerRef}
              className="w-full border border-input rounded-lg p-2"
              style={{
                // PlaceAutocompleteElement comes with its own styling
                // We need to ensure it fits within our layout
                minHeight: '40px',
              }}
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleUseCurrentLocation}
            disabled={isGettingLocation}
            className="shrink-0"
          >
            {isGettingLocation ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            <span className="ml-2 hidden sm:inline">Current</span>
          </Button>
        </div>
      )}
    </div>
  );
}
