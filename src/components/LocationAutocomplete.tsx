"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { MapPin, X, Loader2 } from 'lucide-react';
import { GOOGLE_MAPS_LIBRARIES } from '@/lib/googleMaps';

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string, placeId?: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

// Location types that represent areas larger than ~20 miles
const INVALID_PLACE_TYPES = [
  'administrative_area_level_1', // State/Province
  'administrative_area_level_2', // County (can be large)
  'country',
  'continent',
];

// Location types we accept (roughly 20 miles or smaller)
const VALID_PLACE_TYPES = [
  'locality',           // City
  'sublocality',        // Neighborhood
  'sublocality_level_1',
  'sublocality_level_2',
  'neighborhood',
  'street_address',
  'route',
  'premise',
  'subpremise',
  'postal_code',
  'airport',
  'park',
  'point_of_interest',
  'natural_feature',
  'establishment',
];

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "e.g. Austin, TX or 123 Main St, Dallas",
  required = false,
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isValidSelection, setIsValidSelection] = useState(!!value);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_SERVICES_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  // Initialize services when Google Maps is loaded
  useEffect(() => {
    if (isLoaded && window.google) {
      // Note: AutocompleteService is deprecated for new customers as of March 2025.
      // Migration to AutocompleteSuggestion requires the new Places Library.
      // We're using the existing service for now as it works for existing keys,
      // but we've migrated PlacesService (below) to the new Place class.
      autocompleteService.current = new google.maps.places.AutocompleteService();
    }
  }, [isLoaded]);

  // Sync external value changes
  useEffect(() => {
    if (value !== inputValue && value) {
      setInputValue(value);
      setIsValidSelection(true);
    }
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        // If user didn't select a valid option, clear the input
        if (!isValidSelection && inputValue) {
          setInputValue('');
          onChange('');
          setError('Please select a location from the dropdown');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isValidSelection, inputValue, onChange]);

  const validatePlaceType = useCallback((placeTypes: string[]): { valid: boolean; reason?: string } => {
    // Check if any invalid (too large) place types are present
    for (const type of placeTypes) {
      if (INVALID_PLACE_TYPES.includes(type)) {
        if (type === 'administrative_area_level_1') {
          return { valid: false, reason: 'Please select a city or address, not a state/province' };
        }
        if (type === 'country') {
          return { valid: false, reason: 'Please select a city or address, not a country' };
        }
        if (type === 'administrative_area_level_2') {
          // Counties can be large, but check if it also has a more specific type
          const hasMoreSpecific = placeTypes.some(t => VALID_PLACE_TYPES.includes(t));
          if (!hasMoreSpecific) {
            return { valid: false, reason: 'County is too broad. Please select a city or address' };
          }
        }
      }
    }
    return { valid: true };
  }, []);

  const fetchPredictions = useCallback((input: string) => {
    if (!autocompleteService.current || input.length < 2) {
      setPredictions([]);
      return;
    }

    setIsLoading(true);

    autocompleteService.current.getPlacePredictions(
      {
        input,
        types: ['geocode', 'establishment'], // Get geocodes and establishments
      },
      (results, status) => {
        setIsLoading(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          // Filter out results that are likely too broad (states, countries)
          const filtered = results.filter(prediction => {
            const types = prediction.types || [];
            // Exclude if it's primarily a state or country
            const isPrimarilyLargeArea = types.some(t =>
              t === 'administrative_area_level_1' || t === 'country'
            ) && !types.some(t =>
              t === 'locality' || t === 'sublocality' || t === 'postal_code'
            );
            return !isPrimarilyLargeArea;
          });
          setPredictions(filtered);
        } else {
          setPredictions([]);
        }
      }
    );
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsValidSelection(false);
    setError(null);
    onChange(''); // Clear the actual value until a valid selection is made

    // Debounce the API call
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (newValue.length >= 2) {
      debounceTimer.current = setTimeout(() => {
        fetchPredictions(newValue);
        setIsOpen(true);
      }, 300);
    } else {
      setPredictions([]);
      setIsOpen(false);
    }
  };

  const handleSelectPrediction = async (prediction: google.maps.places.AutocompletePrediction) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use the new Place class (replacement for PlacesService)
      // We ignore TS errors here because @types/google.maps might not be up to date with v3.58+ Place API
      // @ts-ignore
      const place = new google.maps.places.Place({
        id: prediction.place_id,
      });

      // Fetch specific fields
      // @ts-ignore
      await place.fetchFields({
        fields: ['types', 'formattedAddress', 'displayName', 'location'],
      });

      // @ts-ignore
      const placeTypes = place.types || [];
      const validation = validatePlaceType(placeTypes);

      if (!validation.valid) {
        setError(validation.reason || 'This location is too broad. Please select a more specific location.');
        setIsValidSelection(false);
        return;
      }

      // @ts-ignore
      const displayValue = place.formattedAddress || prediction.description;
      setInputValue(displayValue);
      setIsValidSelection(true);
      setIsOpen(false);
      setPredictions([]);
      onChange(displayValue, prediction.place_id);

    } catch (err) {
      console.error("Error fetching place details:", err);
      // Fallback to using prediction description if Place details fail
      setInputValue(prediction.description);
      setIsValidSelection(true);
      setIsOpen(false);
      setPredictions([]);
      onChange(prediction.description, prediction.place_id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setIsValidSelection(false);
    setPredictions([]);
    setError(null);
    onChange('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      if (!isValidSelection) {
        setInputValue('');
        onChange('');
      }
    }
  };

  if (!isLoaded) {
    return (
      <div className="relative">
        <div className="w-full bg-background border border-input rounded-lg px-4 py-4 text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading location services...
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => inputValue.length >= 2 && predictions.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full bg-background border rounded-lg pl-4 pr-10 py-4 text-foreground placeholder-muted-foreground focus:ring-2 focus:border-primary outline-none text-lg transition-colors ${error ? 'border-destructive focus:ring-destructive' :
              isValidSelection ? 'border-success focus:ring-success' :
                'border-input focus:ring-ring'
            }`}
        />

        {/* Clear button or loading indicator */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {isLoading && (
            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
          )}
          {inputValue && !isLoading && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear location"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-destructive flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          {error}
        </p>
      )}

      {/* Validation hint */}
      {!isValidSelection && inputValue && !error && (
        <p className="mt-2 text-sm text-muted-foreground">
          Select a location from the dropdown (city, neighborhood, or address)
        </p>
      )}

      {/* Dropdown */}
      {isOpen && predictions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-lg shadow-xl overflow-hidden"
        >
          <ul className="max-h-64 overflow-y-auto">
            {predictions.map((prediction) => (
              <li key={prediction.place_id}>
                <button
                  type="button"
                  onClick={() => handleSelectPrediction(prediction)}
                  className="w-full px-4 py-3 text-left text-popover-foreground hover:bg-muted flex items-start gap-3 transition-colors border-b border-border last:border-b-0"
                >
                  <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-base font-medium">
                      {prediction.structured_formatting.main_text}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {prediction.structured_formatting.secondary_text}
                    </span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <div className="px-4 py-2 bg-muted border-t border-border">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Select a city, address, or neighborhood (max ~20 mile area)
            </p>
          </div>
        </div>
      )}

      {/* No results message */}
      {isOpen && inputValue.length >= 2 && predictions.length === 0 && !isLoading && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-lg shadow-xl p-4"
        >
          <p className="text-muted-foreground text-sm text-center">
            No locations found. Try a different search term.
          </p>
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;
