'use client';

import React, { useState } from 'react';
import { Loader2, AlertCircle, MapPin } from 'lucide-react';
import { MapComponent } from '@/components/plans/map/MapComponent';
import { RouteOverlayPanel } from '@/components/plans/map/RouteOverlayPanel';
import { MobileRouteSheet } from '@/components/plans/map/MobileRouteSheet';
import type { LocationData } from '@/types/wizard';
import type { EvacuationRoute } from '@/types/mission-report';

interface MapTabProps {
  location: LocationData;
  routes: EvacuationRoute[];
  isLoading: boolean;
  error: string | null;
}

// Route colors matching v1 (amber, green, blue, red, purple)
const ROUTE_COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6'];

export function MapTab({ location, routes, isLoading, error }: MapTabProps) {
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number | null>(0);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [shouldAutoZoom, setShouldAutoZoom] = useState(false);

  // Handler for route selection from panel (triggers auto-zoom)
  const handleRouteSelectFromPanel = (index: number): void => {
    setShouldAutoZoom(true);
    setSelectedRouteIndex(prev => prev === index ? null : index);
  };

  // Handler for route selection from map markers (no auto-zoom)
  const handleRouteSelectFromMap = (index: number): void => {
    setShouldAutoZoom(false);
    setSelectedRouteIndex(prev => prev === index ? null : index);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Generating Evacuation Routes
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
            Our AI is analyzing your location and scenarios to create optimal evacuation routes.
            This may take a few moments...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Route Generation Error
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // No routes state
  if (!routes || routes.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center max-w-md">
          <MapPin className="h-12 w-12 mx-auto mb-4 text-slate-400 dark:text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            No Evacuation Routes Available
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your selected scenarios may not require evacuation routes, or routes could not be
            generated for your location.
          </p>
        </div>
      </div>
    );
  }

  // Success state - show map and routes (Google Maps-style overlay)
  return (
    <div>
      {/* Desktop: Google Maps-style overlay layout */}
      <div className="hidden lg:block relative h-[calc(100vh-260px)] min-h-[600px]">
        {/* Map Container - Full Width Background */}
        <div className="absolute inset-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg">
          <MapComponent
            routes={routes}
            location={location}
            selectedRouteIndex={selectedRouteIndex}
            onRouteSelect={handleRouteSelectFromMap}
            shouldAutoZoom={shouldAutoZoom}
            isPanelMinimized={isPanelMinimized}
          />
        </div>

        {/* Floating Route Panel - Flush to map edge, max 1/3 width */}
        <div
          className="absolute top-0 left-0 bottom-0 overflow-hidden z-20"
          style={{ width: '340px', maxWidth: '33%', minWidth: 0 }}
        >
          <RouteOverlayPanel
            routes={routes}
            selectedRouteIndex={selectedRouteIndex}
            onSelectRoute={handleRouteSelectFromPanel}
            colors={ROUTE_COLORS}
            isMinimized={isPanelMinimized}
            onToggleMinimize={() => setIsPanelMinimized(!isPanelMinimized)}
          />
        </div>
      </div>

      {/* Mobile: Bottom sheet layout with swipeable drawer */}
      <div className="lg:hidden relative h-[calc(100vh-220px)] min-h-[500px]">
        {/* Map Container - Full Width/Height Background */}
        <div className="absolute inset-0 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-lg">
          <MapComponent
            routes={routes}
            location={location}
            selectedRouteIndex={selectedRouteIndex}
            onRouteSelect={handleRouteSelectFromMap}
            shouldAutoZoom={shouldAutoZoom}
            isPanelMinimized={false}
          />
        </div>

        {/* Mobile Route Sheet - Bottom Drawer - Only render on mobile */}
        {typeof window !== 'undefined' && window.innerWidth < 1024 && (
          <MobileRouteSheet
            routes={routes}
            selectedRouteIndex={selectedRouteIndex}
            onSelectRoute={handleRouteSelectFromPanel}
            colors={ROUTE_COLORS}
          />
        )}
      </div>
    </div>
  );
}
