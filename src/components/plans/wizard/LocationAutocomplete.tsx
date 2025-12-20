"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { MapPin, Loader2, AlertTriangle, Info, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
    hint: 'Please enter your location manually.',
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
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCity, setManualCity] = useState('');
  const [manualState, setManualState] = useState('');
  const [manualCountry, setManualCountry] = useState('United States');
  const hasLoggedError = useRef(false);

  // Debug: Log component state
  console.log('[LocationAutocomplete] Render:', {
    isLoaded,
    loadError: !!loadError,
    apiError: !!apiError,
    showManualEntry,
    address,
    hasContainer: !!autocompleteContainerRef.current,
    hasAutocomplete: !!placeAutocompleteRef.current,
  });

  /**
   * Handle Google Maps API errors
   */
  const handleApiError = useCallback((errorName: string, originalError?: Error) => {
    const errorInfo = GOOGLE_ERROR_MESSAGES[errorName] || {
      message: 'Location services are temporarily unavailable.',
      hint: 'Please enter your location manually.',
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
    console.log('[LocationAutocomplete] useEffect called:', {
      isLoaded,
      hasContainer: !!autocompleteContainerRef.current,
      apiError: !!apiError,
      showManualEntry,
      hasExisting: !!placeAutocompleteRef.current,
    });

    if (!isLoaded || !autocompleteContainerRef.current || apiError || showManualEntry) {
      console.log('[LocationAutocomplete] Skipping initialization');
      return;
    }

    // If autocomplete already exists, don't create a new one
    if (placeAutocompleteRef.current) {
      console.log('[LocationAutocomplete] Autocomplete already exists');
      return;
    }

    const initAutocomplete = async () => {
      console.log('[LocationAutocomplete] Starting autocomplete initialization');
      try {
        // Double-check container is still available and not already initialized
        console.log('[LocationAutocomplete] Checking container:', !!autocompleteContainerRef.current);
        if (!autocompleteContainerRef.current || placeAutocompleteRef.current) {
          console.log('[LocationAutocomplete] Container check failed, aborting');
          return;
        }

        // Import the places library
        console.log('[LocationAutocomplete] Importing places library');
        await google.maps.importLibrary('places');
        console.log('[LocationAutocomplete] Places library imported successfully');

        // Create PlaceAutocompleteElement
        console.log('[LocationAutocomplete] Creating PlaceAutocompleteElement');
        // @ts-ignore - PlaceAutocompleteElement types may not be up to date
        const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({
          // Restrict to geocode results (cities, addresses)
          componentRestrictions: undefined,
        });
        console.log('[LocationAutocomplete] PlaceAutocompleteElement created:', !!placeAutocomplete);

        placeAutocompleteRef.current = placeAutocomplete;
        console.log('[LocationAutocomplete] Ref set successfully');

        // Add event listener for place selection (gmp-select is the new event name)
        console.log('[LocationAutocomplete] Adding gmp-select event listener');
        // @ts-ignore - Event types may not be up to date
        placeAutocomplete.addEventListener('gmp-select', async (event: any) => {
          try {
            // Get the place prediction and convert to Place object
            const place = event.placePrediction?.toPlace();
            if (!place) return;

            // Fetch place details with the new API
            await place.fetchFields({
              fields: ['addressComponents', 'formattedAddress', 'location', 'id', 'types'],
            });

            // Validate location is specific enough (not just country/state/city)
            // @ts-ignore - types property may not be typed
            const placeTypes = place.types || [];
            const isTooGeneral = placeTypes.some((type: string) =>
              ['country', 'administrative_area_level_1', 'administrative_area_level_2', 'locality', 'postal_code'].includes(type)
            ) && !placeTypes.some((type: string) =>
              ['street_address', 'route', 'premise', 'subpremise', 'neighborhood', 'sublocality', 'sublocality_level_1', 'point_of_interest', 'establishment', 'park', 'natural_feature'].includes(type)
            );

            if (isTooGeneral) {
              setValidationError('Please enter a more specific location (street address, neighborhood, or landmark)');
              // Clear the autocomplete input
              setAutocompleteValue('');
              return;
            }

            // Convert to our LocationData format
            const locationData = extractLocationDataFromPlace(place);
            onLocationSelect(locationData);
            setAddress(place.formattedAddress || '');
            setValidationError(null);
          } catch (err) {
            console.error('[LocationAutocomplete] Error handling place selection:', err);
          }
        });
        console.log('[LocationAutocomplete] Event listener added successfully');

        // Append to container (recheck it's still available)
        console.log('[LocationAutocomplete] Checking if container still available for appendChild:', !!autocompleteContainerRef.current);
        if (autocompleteContainerRef.current) {
          console.log('[LocationAutocomplete] Appending PlaceAutocompleteElement to container');
          autocompleteContainerRef.current.appendChild(placeAutocomplete);
          console.log('[LocationAutocomplete] PlaceAutocompleteElement appended successfully');
          
          // Force explicit sizing and visibility on the PlaceAutocompleteElement
          // @ts-ignore - style property may not be typed
          placeAutocomplete.style.display = 'block';
          // @ts-ignore
          placeAutocomplete.style.visibility = 'visible';
          // @ts-ignore
          placeAutocomplete.style.opacity = '1';
          // @ts-ignore
          placeAutocomplete.style.width = '100%';
          // @ts-ignore
          placeAutocomplete.style.minWidth = '200px';
          // @ts-ignore
          placeAutocomplete.style.maxWidth = '100%';
          // @ts-ignore
          placeAutocomplete.style.height = '50px';
          // @ts-ignore
          placeAutocomplete.style.minHeight = '50px';
          // @ts-ignore
          placeAutocomplete.style.flex = '1';
          // @ts-ignore
          placeAutocomplete.style.outline = 'none';
          // @ts-ignore
          placeAutocomplete.style.border = 'none';
          
          // Remove focus outline via CSS variables
          // @ts-ignore
          placeAutocomplete.style.setProperty('--gmpx-focus-outline', 'none');
          // @ts-ignore
          placeAutocomplete.style.setProperty('--gmpx-color-primary', 'transparent');
          // @ts-ignore
          placeAutocomplete.style.setProperty('--gmpx-focus-outline-color', 'transparent');
          
          console.log('[LocationAutocomplete] Applied styling to PlaceAutocompleteElement');
          
          // Add global style to remove Google Maps focus outline
          const globalStyleId = 'gmp-autocomplete-focus-fix';
          if (!document.getElementById(globalStyleId)) {
            const globalStyle = document.createElement('style');
            globalStyle.id = globalStyleId;
            globalStyle.textContent = `
              gmp-place-autocomplete,
              gmp-place-autocomplete:focus,
              gmp-place-autocomplete:focus-visible,
              gmp-place-autocomplete:focus-within {
                outline: none !important;
                outline-width: 0 !important;
                outline-style: none !important;
                box-shadow: none !important;
              }
            `;
            document.head.appendChild(globalStyle);
          }
          
          // Also remove focus outline via shadow DOM if accessible
          setTimeout(() => {
            try {
              // @ts-ignore - shadowRoot may not be typed
              const shadowRoot = placeAutocomplete.shadowRoot;
              if (shadowRoot) {
                const style = document.createElement('style');
                style.textContent = `
                  * {
                    outline: none !important;
                  }
                  input,
                  input:focus,
                  input:focus-visible,
                  input:focus-within {
                    outline: none !important;
                    outline-width: 0 !important;
                    outline-style: none !important;
                    box-shadow: none !important;
                    border: none !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                  }
                  .pac-target-input,
                  .pac-target-input:focus,
                  .pac-target-input:focus-visible {
                    outline: none !important;
                    outline-width: 0 !important;
                    box-shadow: none !important;
                    border: none !important;
                    display: block !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                  }
                  :host {
                    outline: none !important;
                    display: block !important;
                    visibility: visible !important;
                  }
                  :host(:focus),
                  :host(:focus-visible),
                  :host(:focus-within) {
                    outline: none !important;
                    box-shadow: none !important;
                  }
                `;
                shadowRoot.appendChild(style);
                
                // Ensure input element is visible
                const inputElement = shadowRoot.querySelector('input');
                if (inputElement) {
                  inputElement.style.display = 'block';
                  inputElement.style.visibility = 'visible';
                  inputElement.style.opacity = '1';
                  inputElement.style.width = '100%';
                }
              }
            } catch (e) {
              // Shadow DOM access may fail, that's okay
              console.debug('[LocationAutocomplete] Could not access shadow DOM for styling');
            }
          }, 100);
          
          // Additional check after longer delay to ensure visibility
          setTimeout(() => {
            try {
              // @ts-ignore
              const shadowRoot = placeAutocomplete.shadowRoot;
              if (shadowRoot) {
                const inputElement = shadowRoot.querySelector('input');
                if (inputElement) {
                  inputElement.style.display = 'block';
                  inputElement.style.visibility = 'visible';
                  inputElement.style.opacity = '1';
                  inputElement.style.width = '100%';
                  console.log('[LocationAutocomplete] Ensured input visibility after delay');
                }
              }
            } catch (e) {
              console.debug('[LocationAutocomplete] Could not ensure input visibility');
            }
          }, 500);
          
          // Set up a periodic check to ensure input stays visible
          const visibilityCheckInterval = setInterval(() => {
            try {
              // @ts-ignore
              const shadowRoot = placeAutocomplete.shadowRoot;
              if (shadowRoot) {
                const inputElement = shadowRoot.querySelector('input');
                if (inputElement) {
                  const computedStyle = window.getComputedStyle(inputElement);
                  if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0') {
                    console.warn('[LocationAutocomplete] Input was hidden, restoring visibility');
                    inputElement.style.display = 'block';
                    inputElement.style.visibility = 'visible';
                    inputElement.style.opacity = '1';
                    inputElement.style.width = '100%';
                  }
                }
              }
            } catch (e) {
              // Silently fail
            }
          }, 1000);
          
          // Store interval ID for cleanup
          (placeAutocomplete as any)._visibilityCheckInterval = visibilityCheckInterval;
        }
      } catch (err) {
        console.error('[LocationAutocomplete] Error initializing PlaceAutocompleteElement:', err);
        handleApiError('InitializationError', err as Error);
      }
    };

    initAutocomplete();

    // Cleanup
    return () => {
      if (placeAutocompleteRef.current) {
        try {
          // Clear the visibility check interval
          const interval = (placeAutocompleteRef.current as any)._visibilityCheckInterval;
          if (interval) {
            clearInterval(interval);
          }
          
          // Remove from container if still attached
          if (placeAutocompleteRef.current.parentNode) {
            placeAutocompleteRef.current.parentNode.removeChild(placeAutocompleteRef.current);
          }
        } catch (e) {
          // Element may already be removed
          console.warn('[LocationAutocomplete] Cleanup error:', e);
        }
        placeAutocompleteRef.current = null;
      }
    };
  }, [isLoaded, apiError, showManualEntry, handleApiError]);

  /**
   * Re-append PlaceAutocompleteElement when container becomes available again
   * (e.g., when address is cleared after being set)
   */
  useEffect(() => {
    console.log('[LocationAutocomplete] Re-append check:', {
      hasContainer: !!autocompleteContainerRef.current,
      hasElement: !!placeAutocompleteRef.current,
      elementInDOM: placeAutocompleteRef.current?.parentNode === autocompleteContainerRef.current,
      address,
    });

    if (
      autocompleteContainerRef.current &&
      placeAutocompleteRef.current &&
      placeAutocompleteRef.current.parentNode !== autocompleteContainerRef.current
    ) {
      // PlaceAutocompleteElement exists but is not in the container - re-append it
      console.log('[LocationAutocomplete] Re-appending PlaceAutocompleteElement to container');
      autocompleteContainerRef.current.appendChild(placeAutocompleteRef.current);
      console.log('[LocationAutocomplete] PlaceAutocompleteElement re-appended successfully');
    }
  }, [address]);

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
        // Ensure the PlaceAutocompleteElement itself is visible
        // @ts-ignore
        if (placeAutocompleteRef.current) {
          // @ts-ignore
          placeAutocompleteRef.current.style.display = 'block';
          // @ts-ignore
          placeAutocompleteRef.current.style.visibility = 'visible';
        }
        
        // PlaceAutocompleteElement uses Shadow DOM, need to access shadowRoot
        // @ts-ignore - shadowRoot might not be typed
        const shadowRoot = placeAutocompleteRef.current?.shadowRoot;
        if (shadowRoot) {
          const inputElement = shadowRoot.querySelector('input');
          if (inputElement) {
            inputElement.value = value;
            // Ensure input is visible
            inputElement.style.display = '';
            inputElement.style.visibility = 'visible';
            inputElement.style.opacity = '1';
            // Trigger input event so any listeners are notified
            inputElement.dispatchEvent(new Event('input', { bubbles: true }));
            console.log('[LocationAutocomplete] Successfully set autocomplete value:', value);
            return true;
          }
        } else {
          // Fallback: try direct querySelector (in case shadow DOM is not used)
          // @ts-ignore
          if (placeAutocompleteRef.current) {
            // @ts-ignore
            placeAutocompleteRef.current.style.display = 'block';
            // @ts-ignore
            placeAutocompleteRef.current.style.visibility = 'visible';
          }
          
          const inputElement = placeAutocompleteRef.current?.querySelector('input');
          if (inputElement) {
            inputElement.value = value;
            // Ensure input is visible
            inputElement.style.display = '';
            inputElement.style.visibility = 'visible';
            inputElement.style.opacity = '1';
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
        setIsGettingLocation(false);

        let errorMessage = 'Failed to get your location.';

        if (geoError.code === geoError.PERMISSION_DENIED) {
          // User declined - this is expected behavior, not an error
          errorMessage = 'Location access was denied. Please use the search box above to enter your location.';
        } else if (geoError.code === geoError.POSITION_UNAVAILABLE) {
          console.warn('Geolocation unavailable:', geoError);
          errorMessage = 'Location information is unavailable. Please use the search box above to enter your location.';
        } else if (geoError.code === geoError.TIMEOUT) {
          console.warn('Geolocation timeout:', geoError);
          errorMessage = 'Location request timed out. Please try again or use the search box above.';
        } else {
          // Unknown error - log as error
          console.error('Geolocation error:', geoError);
        }

        setValidationError(errorMessage);
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseCurrentLocation}
                    disabled={isGettingLocation}
                    className="!h-10 !w-10 !p-0 cursor-pointer hover:cursor-pointer"
                    aria-label="Use current location"
                  >
                    {isGettingLocation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Retrieve your estimated location from the browser</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
              setAutocompleteValue('');
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
        <>
          <div className="flex gap-2 items-center">
            <div className="flex-1">
              {/* PlaceAutocompleteElement container - element will be appended here by useEffect */}
              {/* The web component manages its own input field and value */}
              <div
                ref={autocompleteContainerRef}
                className="w-full border border-input rounded-lg"
                style={{
                  // PlaceAutocompleteElement comes with its own styling
                  // We need to ensure it fits within our layout
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                  minHeight: '54px',
                }}
              />
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseCurrentLocation}
                    disabled={isGettingLocation}
                    className="shrink-0 !h-[54px] !w-[54px] !p-0 cursor-pointer hover:cursor-pointer"
                    aria-label="Use current location"
                  >
                    {isGettingLocation ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <MapPin className="w-5 h-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Retrieve your estimated location from the browser</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Validation Error Message */}
          {validationError && (
            <Alert variant="destructive" className="border-orange-500 bg-orange-50 dark:bg-orange-950/20">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800 dark:text-orange-200">
                {validationError}
              </AlertDescription>
            </Alert>
          )}

          {/* Form Validation Error */}
          {error && !validationError && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </>
      )}
    </div>
  );
}
