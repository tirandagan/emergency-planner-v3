import React from 'react';
import { MapPin, Car, PersonStanding } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { EvacuationRoute } from '@/types/mission-report';
import { cn } from '@/lib/utils';

interface RouteListItemProps {
  route: EvacuationRoute;
  routeNumber: number;
  color: string;
  isSelected: boolean;
  onSelect: () => void;
  isAnyRouteSelected: boolean;  // NEW: true when any route has details shown
  showShorthand: boolean;        // NEW: true when this route should show shorthand
}

export function RouteListItem({ route, routeNumber, color, isSelected, onSelect, isAnyRouteSelected, showShorthand }: RouteListItemProps) {
  // Priority color mapping
  const priorityColors = {
    primary: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    secondary: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    tertiary: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200',
  };

  // Get destination text and strip #E: prefix
  const rawDestination =
    route.destination_description ||
    route.destination_address ||
    (route.waypoints && route.waypoints.length > 0 && route.waypoints[route.waypoints.length - 1].name) ||
    'Destination not specified';

  const destination = rawDestination.replace(/^#E:\s*/i, '').trim();

  // Shorthand mode: number + name + mode badge, dimmed appearance
  if (showShorthand) {
    return (
      <button
        onClick={onSelect}
        className={cn(
          'w-full text-left p-2 rounded-lg border-l-4 transition-all duration-200',
          'hover:shadow-sm hover:scale-[1.01]',
          'bg-slate-100/50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900',
          'opacity-50 dark:opacity-40'
        )}
        style={{
          borderLeftColor: color,
        }}
      >
        <div className="flex items-start gap-2">
          {/* Route Number Badge */}
          <div
            className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg text-white text-sm font-bold shadow-sm"
            style={{ backgroundColor: color }}
          >
            {routeNumber}
          </div>

          {/* Route Name and Mode Badge */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
              {route.name}
            </div>
            {route.mode && (
              <Badge variant="outline" className="text-xs flex items-center gap-1 mt-0.5">
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
          </div>
        </div>
      </button>
    );
  }

  // Full mode: complete route information
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left p-3 rounded-lg border-l-4 transition-all duration-200',
        'hover:shadow-md hover:scale-[1.02]',
        isSelected
          ? 'bg-slate-50 dark:bg-slate-900 shadow-md scale-[1.02]'
          : 'bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900'
      )}
      style={{
        borderLeftColor: color,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Route Number Badge */}
        <div
          className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-white text-sm font-bold shadow-sm"
          style={{ backgroundColor: color }}
        >
          {routeNumber}
        </div>

        {/* Route Info */}
        <div className="flex-1 min-w-0 space-y-1">
          {/* Route Name and Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
              {route.name}
            </span>
            {route.priority && (
              <Badge variant="secondary" className={cn('text-xs', priorityColors[route.priority])}>
                {route.priority}
              </Badge>
            )}
            {route.mode && (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
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
          </div>

          {/* Destination with "Evacuation to:" heading */}
          <div className="space-y-0.5">
            <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Evacuation to:
            </div>
            <div className="flex items-start gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <span className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">{destination}</span>
            </div>
          </div>

          {/* Distance and Time */}
          <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-500">
            <span>{route.distance}</span>
            <span>{route.estimatedTime}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
