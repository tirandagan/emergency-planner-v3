import React from 'react';
import { AlertTriangle, MapPin, Car, PersonStanding, TrendingUp, Info, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EvacuationRoute } from '@/types/mission-report';
import { cn } from '@/lib/utils';

interface RouteCardProps {
  route: EvacuationRoute;
  isSelected: boolean;
  onSelect: () => void;
  color: string;
  routeNumber: number;
}

export function RouteCard({ route, isSelected, onSelect, color, routeNumber }: RouteCardProps) {
  // Priority color mapping
  const priorityColors = {
    primary: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    secondary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    tertiary: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-300 ease-out border-l-4',
        'hover:shadow-xl hover:scale-[1.02]',
        'max-w-full min-w-0 overflow-hidden', // Force width constraint
        isSelected ? 'ring-2 ring-offset-2 shadow-xl scale-[1.02]' : 'hover:shadow-lg'
      )}
      style={{
        borderLeftColor: color,
        // @ts-expect-error - CSS custom property for ring color
        '--tw-ring-color': isSelected ? color : undefined,
      }}
      onClick={onSelect}
    >
      <CardHeader className="pb-4 space-y-3">
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="flex-1 space-y-2 min-w-0">
            <CardTitle className="text-lg flex items-center gap-3 flex-wrap min-w-0">
              <span
                className="flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm font-bold shadow-md"
                style={{ backgroundColor: color }}
              >
                {routeNumber}
              </span>
              <span className="text-slate-900 dark:text-slate-100 truncate">{route.name}</span>
              {route.priority && (
                <Badge variant="secondary" className={cn('text-xs font-medium', priorityColors[route.priority])}>
                  {route.priority}
                </Badge>
              )}
              {route.mode && (
                <Badge variant="outline" className="text-xs font-medium flex items-center gap-1">
                  {route.mode === 'vehicle' ? (
                    <>
                      <Car className="h-3 w-3" />
                      Vehicle
                    </>
                  ) : (
                    <>
                      <PersonStanding className="h-3 w-3" />
                      On Foot
                    </>
                  )}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
              {route.description}
            </CardDescription>
          </div>
        </div>

        {/* Destination - Show where this route leads */}
        {(route.destination_description || route.destination_address || (route.waypoints && route.waypoints.length > 0)) && (
          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  EVACUATION TO:
                </div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {(() => {
                    const rawDestination = route.destination_description ||
                      route.destination_address ||
                      (route.waypoints && route.waypoints.length > 0 ? route.waypoints[route.waypoints.length - 1].name : undefined);
                    return rawDestination ? rawDestination.replace(/^#E:\s*/i, '').trim() : 'Unknown destination';
                  })()}
                </div>
                {route.destination_scenario_rationale && (
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {route.destination_scenario_rationale}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Distance and Time */}
        <div className="flex gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-400" />
            <span className="text-slate-700 dark:text-slate-300">{route.distance}</span>
          </div>
          <div className="text-slate-700 dark:text-slate-300">
            {route.estimatedTime}
          </div>
        </div>

        {/* Rationale Summary */}
        {route.rationale?.summary && (
          <div className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 p-2 rounded">
            <div className="flex items-start gap-1.5">
              <Info className="h-3.5 w-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
              <span>{route.rationale.summary}</span>
            </div>
          </div>
        )}

        {/* Waypoints List with Letters and Google Maps Links */}
        {route.waypoints && route.waypoints.length > 2 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
              <MapPin className="h-3.5 w-3.5" />
              <span>Waypoints</span>
            </div>
            <div className="space-y-1.5">
              {/* Intermediate waypoints only (excluding start/end) */}
              {route.waypoints.slice(1, -1).map((waypoint, index) => {
                // Generate Google Maps URL - use coordinates if available (geocoded), otherwise search by name
                const googleMapsUrl =
                  waypoint.lat !== undefined && waypoint.lng !== undefined
                    ? `https://www.google.com/maps/search/?api=1&query=${waypoint.lat},${waypoint.lng}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(waypoint.name)}`;

                return (
                  <div
                    key={index}
                    className="flex gap-2 text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded"
                  >
                    <span
                      className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full text-white font-bold text-[10px]"
                      style={{ backgroundColor: color }}
                    >
                      {String.fromCharCode(97 + index)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {waypoint.name}
                        </div>
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                          title="Open in Google Maps"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      {waypoint.description && (
                        <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                          {waypoint.description}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Risks */}
        {route.risks && route.risks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-orange-700 dark:text-orange-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Key Risks</span>
            </div>
            <ul className="space-y-1">
              {route.risks.slice(0, 2).map((risk, index) => (
                <li key={index} className="text-xs text-slate-600 dark:text-slate-400 pl-5">
                  • {risk.description}
                </li>
              ))}
              {route.risks.length > 2 && (
                <li className="text-xs text-slate-500 dark:text-slate-500 pl-5">
                  + {route.risks.length - 2} more
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Hazards (fallback for legacy routes) */}
        {(!route.risks || route.risks.length === 0) && route.hazards && route.hazards.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Hazards</span>
            </div>
            <ul className="space-y-1">
              {route.hazards.map((hazard, index) => (
                <li key={index} className="text-xs text-slate-600 dark:text-slate-400 pl-5">
                  • {hazard}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* EMP Considerations */}
        {route.rationale?.emp_specific_considerations && route.rationale.emp_specific_considerations.length > 0 && (
          <div className="text-xs text-slate-600 dark:text-slate-400 bg-amber-50 dark:bg-amber-950 p-2 rounded">
            <div className="font-medium text-amber-900 dark:text-amber-200 mb-1">EMP Considerations:</div>
            <ul className="space-y-0.5">
              {route.rationale.emp_specific_considerations.slice(0, 2).map((consideration, index) => (
                <li key={index}>• {consideration}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
