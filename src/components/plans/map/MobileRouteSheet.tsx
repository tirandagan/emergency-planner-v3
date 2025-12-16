import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { RouteListItem } from './RouteListItem';
import { RouteCard } from './RouteCard';
import type { EvacuationRoute } from '@/types/mission-report';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface MobileRouteSheetProps {
  routes: EvacuationRoute[];
  selectedRouteIndex: number | null;
  onSelectRoute: (index: number) => void;
  colors: string[];
}

type SheetState = 'collapsed' | 'half' | 'expanded';

export function MobileRouteSheet({
  routes,
  selectedRouteIndex,
  onSelectRoute,
  colors,
}: MobileRouteSheetProps) {
  const [sheetState, setSheetState] = useState<SheetState>('half');
  const [isDragging, setIsDragging] = useState(false);
  const [currentHeight, setCurrentHeight] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const startHeightRef = useRef<number>(0);

  const toggleSheet = (): void => {
    if (sheetState === 'collapsed') {
      setSheetState('half');
    } else if (sheetState === 'half') {
      // If content is small, go to collapsed, otherwise expanded
      const contentHeight = calculateContentHeight();
      const vh = window.innerHeight;
      if (contentHeight < vh * 0.45) {
        setSheetState('collapsed');
      } else {
        setSheetState('expanded');
      }
    } else {
      setSheetState('collapsed');
    }
  };

  // Calculate actual content height
  const calculateContentHeight = useCallback((): number => {
    if (!contentRef.current) return 0;

    const headerHeight = 64; // Drag handle + padding
    const contentHeight = contentRef.current.scrollHeight;
    const totalHeight = headerHeight + contentHeight;
    const maxHeight = window.innerHeight * 0.85;

    return Math.min(totalHeight, maxHeight);
  }, []);

  // Get sheet height based on state or current drag
  const getSheetHeight = useCallback((): string => {
    if (isDragging && currentHeight !== null) {
      return `${currentHeight}px`;
    }

    const vh = window.innerHeight;

    if (sheetState === 'collapsed') {
      return '96px'; // Enough for drag bar + badges + button
    }

    if (sheetState === 'half') {
      // Use content-based height or default 45vh
      const contentHeight = calculateContentHeight();
      const halfVh = vh * 0.45;

      // If content is smaller than half screen, use content height
      if (contentHeight > 0 && contentHeight < halfVh) {
        return `${contentHeight}px`;
      }
      return `${halfVh}px`;
    }

    // Expanded: use content height or 80vh
    const contentHeight = calculateContentHeight();
    const expandedVh = vh * 0.80;

    if (contentHeight > 0 && contentHeight < expandedVh) {
      return `${contentHeight}px`;
    }
    return `${expandedVh}px`;
  }, [isDragging, currentHeight, sheetState, calculateContentHeight]);

  // Initialize height on mount
  useEffect(() => {
    if (!isInitialized && contentRef.current && sheetRef.current) {
      // Force initial height calculation
      const height = getSheetHeight();
      sheetRef.current.style.height = height;
      setIsInitialized(true);
    }
  }, [isInitialized, getSheetHeight]);

  // Auto-expand if route is pre-selected on mount
  useEffect(() => {
    if (isInitialized && selectedRouteIndex !== null && sheetState === 'half') {
      // Expand to show route details
      setSheetState('expanded');
    }
  }, [isInitialized, selectedRouteIndex, sheetState]);

  // Update height when content changes
  useEffect(() => {
    if (!isDragging && sheetRef.current) {
      const height = getSheetHeight();
      sheetRef.current.style.height = height;
    }
  }, [getSheetHeight, isDragging, selectedRouteIndex, sheetState, routes.length]);

  // Unified drag start handler (touch or mouse)
  const handleDragStart = useCallback((clientY: number): void => {
    if (!sheetRef.current) return;

    setIsDragging(true);
    startYRef.current = clientY;
    startHeightRef.current = sheetRef.current.offsetHeight;
  }, []);

  // Unified drag move handler (touch or mouse)
  const handleDragMove = useCallback((clientY: number): void => {
    if (!isDragging || !sheetRef.current) return;

    const deltaY = startYRef.current - clientY; // Positive = drag up
    const newHeight = Math.max(
      96, // Minimum (collapsed height)
      Math.min(
        window.innerHeight * 0.85, // Maximum
        startHeightRef.current + deltaY
      )
    );

    setCurrentHeight(newHeight);
    sheetRef.current.style.height = `${newHeight}px`;
  }, [isDragging]);

  // Unified drag end handler
  const handleDragEnd = useCallback((): void => {
    if (!isDragging) return;

    setIsDragging(false);

    const vh = window.innerHeight;
    const finalHeight = currentHeight || startHeightRef.current;

    // Snap to nearest state
    if (finalHeight < vh * 0.15) {
      setSheetState('collapsed');
    } else if (finalHeight < vh * 0.60) {
      setSheetState('half');
    } else {
      setSheetState('expanded');
    }

    setCurrentHeight(null);
  }, [isDragging, currentHeight]);

  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent): void => {
    const touch = e.touches[0];
    if (!touch) return;
    handleDragStart(touch.clientY);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent): void => {
    const touch = e.touches[0];
    if (!touch) return;
    handleDragMove(touch.clientY);
  }, [handleDragMove]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent): void => {
    e.preventDefault(); // Prevent text selection
    handleDragStart(e.clientY);

    // Add temporary mouse listeners to window
    const handleMouseMove = (moveEvent: MouseEvent): void => {
      handleDragMove(moveEvent.clientY);
    };

    const handleMouseUp = (): void => {
      handleDragEnd();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [handleDragStart, handleDragMove, handleDragEnd]);

  // Determine if button should show down arrow (to minimize)
  const shouldShowDownArrow = (): boolean => {
    if (sheetState === 'expanded') return true; // Collapse from expanded
    if (sheetState === 'collapsed') return false; // Expand from collapsed

    // In half state: show down if content fits (can collapse), up if more content (can expand)
    const contentHeight = calculateContentHeight();
    const vh = window.innerHeight;
    return contentHeight < vh * 0.45; // If content is small, show down (collapse)
  };

  return (
    <div
      ref={sheetRef}
      className={cn(
        'fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 rounded-t-2xl shadow-2xl border-t border-slate-200 dark:border-slate-800 z-30',
        'lg:!hidden block max-lg:block',
        isDragging ? '' : 'transition-all duration-300 ease-out'
      )}
      style={{ height: getSheetHeight() }}
    >
      {/* Drag Handle - Only the thin bar is draggable */}
      <div className="w-full flex flex-col items-center pt-3 pb-2">
        {/* Thin drag bar - this is the draggable area */}
        <div
          ref={dragHandleRef}
          className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mb-2 cursor-grab active:cursor-grabbing touch-manipulation"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleDragEnd}
          onTouchCancel={handleDragEnd}
          onMouseDown={handleMouseDown}
        />

        {sheetState === 'collapsed' ? (
          // Collapsed state - minimal info with centered round expand button
          <div className="flex flex-col items-center w-full gap-2">
            <div className="flex gap-2 items-center">
              <Badge variant="secondary" className="text-xs">
                {routes.length} {routes.length === 1 ? 'Route' : 'Routes'}
              </Badge>
              {selectedRouteIndex !== null && (
                <Badge className="text-xs" style={{ backgroundColor: colors[selectedRouteIndex % colors.length] }}>
                  Route {selectedRouteIndex + 1}
                </Badge>
              )}
            </div>
            <button
              onClick={toggleSheet}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors shadow-md"
              aria-label="Expand route panel"
            >
              <ChevronUp className="h-5 w-5 text-slate-600 dark:text-slate-400" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          // Half/Expanded state - full header with button
          <button
            onClick={toggleSheet}
            className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100"
            aria-label={
              shouldShowDownArrow()
                ? 'Collapse route panel'
                : 'Expand route panel fully'
            }
          >
            <span>Route Options ({routes.length})</span>
            {shouldShowDownArrow() ? (
              <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
            ) : (
              <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
            )}
          </button>
        )}
      </div>

      {/* Sheet Content - Single Scrollable Area */}
      {sheetState !== 'collapsed' && (
        <div ref={contentRef} className="h-[calc(100%-4rem)] overflow-y-auto flex flex-col">
          {/* Route List */}
          <div className="p-4 space-y-3 flex-shrink-0">
            {routes.map((route, index) => (
              <RouteListItem
                key={index}
                route={route}
                routeNumber={index + 1}
                color={colors[index % colors.length]}
                isSelected={index === selectedRouteIndex}
                isAnyRouteSelected={selectedRouteIndex !== null}
                showShorthand={selectedRouteIndex !== null && index !== selectedRouteIndex}
                onSelect={() => {
                  onSelectRoute(index);
                  // Only auto-expand if selecting a route while in half state
                  if (sheetState === 'half' && selectedRouteIndex !== index) {
                    setSheetState('expanded');
                  }
                }}
              />
            ))}
          </div>

          {/* Route Details */}
          {sheetState === 'expanded' && selectedRouteIndex !== null && (
            <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-800">
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
