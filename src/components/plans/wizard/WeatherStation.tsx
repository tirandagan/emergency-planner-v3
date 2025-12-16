"use client";

import React, { useState, useEffect } from 'react';
import { Cloud, Wind, Droplets, Gauge, Eye, Thermometer, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import type { LocationData } from '@/types/wizard';

interface WeatherStationProps {
  locationData: LocationData;
}

interface WeatherData {
  temp_c: number;
  temp_f: number;
  condition: {
    text: string;
    icon: string;
  };
  wind_kph: number;
  wind_mph: number;
  wind_dir: string;
  pressure_mb: number;
  humidity: number;
  feelslike_c: number;
  feelslike_f: number;
  vis_km: number;
  precip_mm: number;
}

/**
 * Beautiful Weather Station Component
 * Displays real-time weather data for selected location
 */
export function WeatherStation({ locationData }: WeatherStationProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [locationInfo, setLocationInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchWeather = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const apiKey = process.env.NEXT_PUBLIC_WEATHERAPI_API_KEY;
        if (!apiKey) {
          throw new Error('Weather API key not configured');
        }

        const { lat, lng } = locationData.coordinates;
        const response = await fetch(
          `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lng}&aqi=no`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }

        const data = await response.json();
        setWeather(data.current);
        setLocationInfo(data.location);
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load weather');
      } finally {
        setIsLoading(false);
      }
    };

    if (locationData.coordinates.lat && locationData.coordinates.lng) {
      fetchWeather();
    }
  }, [locationData.coordinates.lat, locationData.coordinates.lng]);

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-900 rounded-xl border border-blue-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-center gap-3 text-blue-700 dark:text-blue-300">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading weather data...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !weather) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
          {error || 'Weather data unavailable'}
        </p>
      </div>
    );
  }

  // Parse location's local time from WeatherAPI response
  // The API returns localtime like "2024-12-13 03:31" which is already in location's timezone
  const formatLocalTime = (localtime: string | undefined) => {
    if (!localtime) return { date: '', time: '' };

    // localtime format: "2024-12-13 03:31"
    const [datePart, timePart] = localtime.split(' ');
    const [year, month, day] = datePart.split('-');
    const [hour24, minute] = timePart.split(':');

    // Format date
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const dayName = dayNames[date.getDay()];
    const monthName = monthNames[parseInt(month) - 1];

    // Format time
    const hour = parseInt(hour24);
    const isPM = hour >= 12;
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const ampm = isPM ? 'PM' : 'AM';
    const formattedTime = `${hour12}:${minute} ${ampm}`;
    const formattedDate = `${dayName}, ${monthName} ${parseInt(day)}`;

    return { date: formattedDate, time: formattedTime };
  };

  const { date, time } = formatLocalTime(locationInfo?.localtime);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-900 rounded-lg border border-blue-200 dark:border-slate-700 p-4">
      {/* Header with date/time and expand button */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          {/* Temperature on top */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {Math.round(weather.temp_f)}°
            </span>
            <span className="text-lg text-slate-600 dark:text-slate-400">F</span>
          </div>
        </div>
        <div className="flex items-start gap-2">
          {date && time && (
            <div className="text-right text-xs text-slate-500 dark:text-slate-400">
              <p className="font-medium">{date}</p>
              <p>{time}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
            aria-label={isExpanded ? 'Show less' : 'Show more'}
          >
            {isExpanded ? (
              <ChevronUp className="w-7 h-7" />
            ) : (
              <ChevronDown className="w-7 h-7" />
            )}
          </button>
        </div>
      </div>

      {/* Feels like and condition */}
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Feels like {Math.round(weather.feelslike_f)}°
      </p>
      <p className="text-base font-medium text-slate-700 dark:text-slate-300">
        {weather.condition.text}
      </p>

      {/* Expandable Details */}
      {isExpanded && (
        <>
          {/* Compact Weather Stats - 2 Column Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mt-4 pt-3 border-t border-blue-200 dark:border-slate-700">
            <div className="flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-slate-600 dark:text-slate-400">Wind:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {Math.round(weather.wind_mph)} mph {weather.wind_dir}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Droplets className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-slate-600 dark:text-slate-400">Humidity:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {weather.humidity}%
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-slate-600 dark:text-slate-400">Pressure:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {Math.round(weather.pressure_mb)} mb
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-slate-600 dark:text-slate-400">Visibility:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {Math.round(weather.vis_km * 0.621371)} mi
              </span>
            </div>
          </div>

          {/* Climate Zone Info */}
          {locationData.climateZone && (
            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Climate: <span className="font-medium text-slate-900 dark:text-slate-100">{locationData.climateZone}</span>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
