import React from 'react';
import { ChevronLeft, ChevronRight, Map } from 'lucide-react';
import { RouteListItem } from './RouteListItem';
import { RouteCard } from './RouteCard';
import type { EvacuationRoute } from '@/types/mission-report';
import { cn } from '@/lib/utils';

interface RouteOverlayPanelProps {
  routes: EvacuationRoute[];
  selectedRouteIndex: number | null;
  onSelectRoute: (index: number) => void;
  colors: string[];
  isMinimized: boolean;
  onToggleMinimize: () => void;
}

export function RouteOverlayPanel({
  routes,
  selectedRouteIndex,
  onSelectRoute,
  colors,
  isMinimized,
  onToggleMinimize,
}: RouteOverlayPanelProps) {
  return (
    <div
      className={cn(
        'h-full shadow-2xl transition-all duration-300',
        isMinimized
          ? 'w-12 rounded-r-xl border-r border-t border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950' // Tucked to side - narrow tab
          : 'w-full max-w-full overflow-x-hidden rounded-r-xl border-r border-t border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950' // Expanded - solid white background
      )}
    >
      {/* Minimize Tab - Always Visible */}
      <button
        onClick={onToggleMinimize}
        className={cn(
          'w-full flex items-center justify-center p-3 border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors',
          isMinimized && 'flex-col gap-2'
        )}
        aria-label={isMinimized ? 'Expand route panel' : 'Minimize route panel'}
      >
        {isMinimized ? (
          <>
            <Map className="h-5 w-5 text-slate-600 dark:text-slate-400" strokeWidth={2.5} />
            <span className="text-xs text-slate-600 dark:text-slate-400 [writing-mode:vertical-lr]">Routes</span>
          </>
        ) : (
          <>
            <span className="flex-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Route Options ({routes.length})
            </span>
            <ChevronLeft className="h-4 w-4 text-slate-500 dark:text-slate-400" />
          </>
        )}
      </button>

      {/* Panel Content - Only when expanded */}
      {!isMinimized && (
        <div className="h-[calc(100%-56px)] flex flex-col overflow-hidden min-w-0">
          {/* Route List - Dynamic height based on selection */}
          <div
            className={cn(
              'overflow-y-auto overflow-x-hidden p-3 space-y-2 min-w-0',
              selectedRouteIndex !== null
                ? 'flex-shrink-0 h-[40%] border-b border-slate-200 dark:border-slate-800'
                : 'flex-1'
            )}
          >
            {routes.map((route, index) => (
              <RouteListItem
                key={index}
                route={route}
                routeNumber={index + 1}
                color={colors[index % colors.length]}
                isSelected={index === selectedRouteIndex}
                isAnyRouteSelected={selectedRouteIndex !== null}
                showShorthand={selectedRouteIndex !== null && index !== selectedRouteIndex}
                onSelect={() => onSelectRoute(index)}
              />
            ))}
          </div>

          {/* Route Details - Only shown when route is selected */}
          {selectedRouteIndex !== null && (
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 min-w-0">
              <RouteCard
                route={routes[selectedRouteIndex]}
                routeNumber={selectedRouteIndex + 1}
                color={colors[selectedRouteIndex % colors.length]}
                isSelected={true}
                onSelect={() => {}}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
